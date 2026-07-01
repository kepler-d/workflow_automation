const axios = require('axios');
const WorkflowRun = require('../models/WorkflowRun');
const ExecutionLog = require('../models/ExecutionLog');

/**
 * Execute a single node
 */
const executeNode = async (node, context, runId) => {
  console.log(`[Engine] Executing Node: ${node.id} (${node.type})`);
  
  const log = new ExecutionLog({
    run: runId,
    nodeId: node.id,
    nodeType: node.type,
    status: 'running',
    startedAt: new Date(),
  });
  await log.save();

  const config = node.data?.config || {};
  let outputData = null;
  let errorMsg = null;
  let status = 'success';

  // Helper to get deep value from context (used by condition and email nodes)
  const getDeepValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  try {
    switch (node.type) {
      case 'webhook':
        console.log(`[Engine] Webhook received payload`);
        outputData = { payload: context.payload };
        break;

      case 'log':
        console.log(`[Engine] Log Node:`, config.message);
        outputData = { message: config.message };
        break;

      case 'delay':
        const seconds = config.seconds || 0;
        console.log(`[Engine] Delay Node: Waiting ${seconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        console.log(`[Engine] Delay Node: Resumed`);
        outputData = { waited: seconds };
        break;

      case 'http':
        const method = config.method || 'GET';
        const url = config.url;
        console.log(`[Engine] HTTP Node: Sending ${method} to ${url}`);
        
        if (url) {
          const response = await axios({ method, url, data: context.payload });
          console.log(`[Engine] HTTP Node Success: Status ${response.status}`);
          outputData = { status: response.status, data: response.data };
          context.lastHttpResponse = response.data;
        } else {
          console.log(`[Engine] HTTP Node Skipped: No URL configured`);
          outputData = { skipped: true, reason: 'No URL configured' };
        }
        break;

      case 'condition':
        console.log(`[Engine] IF Condition Node: ${config.field} ${config.operator} ${config.value}`);
        
        const fieldValue = getDeepValue(context, config.field);
        
        // Coerce types for comparison
        let cmpField = fieldValue;
        let cmpValue = config.value;
        if (cmpField !== undefined && cmpValue !== undefined && !isNaN(cmpField) && !isNaN(cmpValue)) {
          cmpField = Number(cmpField);
          cmpValue = Number(cmpValue);
        }

        let conditionResult = false;
        switch (config.operator) {
          case '==': conditionResult = (cmpField == cmpValue); break;
          case '!=': conditionResult = (cmpField != cmpValue); break;
          case '>': conditionResult = (cmpField > cmpValue); break;
          case '<': conditionResult = (cmpField < cmpValue); break;
          case '>=': conditionResult = (cmpField >= cmpValue); break;
          case '<=': conditionResult = (cmpField <= cmpValue); break;
          default: conditionResult = (cmpField == cmpValue);
        }
        
        console.log(`[Engine] Condition evaluated to: ${conditionResult} (Field: ${cmpField}, Value: ${cmpValue})`);
        outputData = { field: config.field, evaluatedTo: conditionResult };
        
        log.status = status;
        log.outputData = outputData;
        log.error = errorMsg;
        log.finishedAt = new Date();
        await log.save();
        
        return { success: true, context, conditionResult };

      case 'email':
        console.log(`[Engine] Email Node: Processing email to ${config.to}`);
        
        const emailService = require('./emailService');
        
        // Simple string replacement for context templating (e.g. {{payload.email}})
        const interpolate = (str, ctx) => {
          if (!str) return '';
          return str.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
            const val = getDeepValue(ctx, path);
            return val !== undefined ? val : match;
          });
        };

        const to = interpolate(config.to, context);
        const subject = interpolate(config.subject, context);
        const body = interpolate(config.body, context);

        const emailResult = await emailService.sendEmail({ to, subject, body });
        
        outputData = { to, subject, result: emailResult };
        break;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  } catch (error) {
    console.error(`[Engine] HTTP Node Error:`, error.message);
    errorMsg = error.message;
    status = 'failed';
  }

  log.status = status;
  log.outputData = outputData;
  log.error = errorMsg;
  log.finishedAt = new Date();
  await log.save();

  return { success: status === 'success', context };
};

/**
 * Run the entire workflow
 */
const executeWorkflow = async (workflow, triggerPayload) => {
  console.log(`\n======================================`);
  console.log(`[Engine] Starting Workflow: ${workflow.name}`);
  console.log(`======================================`);

  const run = new WorkflowRun({
    workflow: workflow._id,
    status: 'running',
    triggerPayload,
    startedAt: new Date(),
  });
  await run.save();

  try {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    // 1. Build adjacency list for edges (source -> targets)
    const graph = {};
    edges.forEach(edge => {
      if (!graph[edge.source]) {
        graph[edge.source] = [];
      }
      graph[edge.source].push({ target: edge.target, handle: edge.sourceHandle });
    });

    // 2. Find start nodes (Webhook or Schedule)
    const startNodes = nodes.filter(n => n.type === 'webhook' || n.type === 'schedule');
    
    if (startNodes.length === 0) {
      console.log(`[Engine] Execution aborted: No webhook trigger found.`);
      run.status = 'failed';
      run.completedAt = new Date();
      await run.save();
      return;
    }

    // 3. Helper to build node lookup
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // 4. Traverse sequentially starting from the webhook nodes
    const queue = startNodes.map(node => ({
      node,
      context: { payload: triggerPayload, pathVisited: new Set() }
    }));

    while (queue.length > 0) {
      const { node, context } = queue.shift();
      
      // Cycle protection
      if (context.pathVisited.has(node.id)) {
        console.log(`[Engine] Cycle detected at node ${node.id}. Aborting this branch.`);
        continue;
      }

      // Create a new visited set for the path going forward
      const nextVisited = new Set(context.pathVisited);
      nextVisited.add(node.id);
      
      // Execute current node
      const { success, context: nextContext, conditionResult } = await executeNode(node, context, run._id);
      nextContext.pathVisited = nextVisited; // Update it on the next context

      if (!success) {
        console.log(`[Engine] Node ${node.id} failed. Stopping traversal for this branch.`);
        // Note: You can either just stop this branch or fail the entire workflow.
        // We'll break the while loop entirely to fail the whole workflow.
        run.status = 'failed';
        run.completedAt = new Date();
        run.durationMs = run.completedAt - run.startedAt;
        await run.save();
        return; // Exit execution early
      }

      // Find next nodes to execute
      const outgoingEdges = graph[node.id] || [];
      for (const edge of outgoingEdges) {
        // If it's a condition node, only follow the edge matching the conditionResult
        if (node.type === 'condition') {
          const expectedHandle = conditionResult ? 'true' : 'false';
          if (edge.handle !== expectedHandle) {
            console.log(`[Engine] Branch ${edge.handle} skipped for condition ${node.id}`);
            continue; 
          }
        }
        
        const targetNode = nodeMap[edge.target];
        if (targetNode) {
          queue.push({
            node: targetNode,
            context: nextContext // Pass the updated context forward
          });
        }
      }
    }

    run.status = 'success';
    run.completedAt = new Date();
    run.durationMs = run.completedAt - run.startedAt;
    await run.save();
    console.log(`[Engine] Workflow execution completed.\n`);

  } catch (error) {
    console.error(`[Engine] Workflow execution failed:`, error);
    run.status = 'failed';
    run.completedAt = new Date();
    run.durationMs = run.completedAt - run.startedAt;
    await run.save();
  }
};

module.exports = {
  executeWorkflow
};
