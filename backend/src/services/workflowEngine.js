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

      default:
        console.log(`[Engine] Unknown node type: ${node.type}`);
        outputData = { error: 'Unknown node type' };
        break;
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

  return context;
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
      graph[edge.source].push(edge.target);
    });

    // 2. Find start nodes (Webhook)
    const startNodes = nodes.filter(n => n.type === 'webhook');
    
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
      const nextContext = await executeNode(node, context, run._id);
      nextContext.pathVisited = nextVisited; // Update it on the next context

      // Find next nodes to execute
      const targetIds = graph[node.id] || [];
      for (const targetId of targetIds) {
        const targetNode = nodeMap[targetId];
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
    await run.save();
    console.log(`[Engine] Workflow execution completed.\n`);

  } catch (error) {
    console.error(`[Engine] Workflow execution failed:`, error);
    run.status = 'failed';
    run.completedAt = new Date();
    await run.save();
  }
};

module.exports = {
  executeWorkflow
};
