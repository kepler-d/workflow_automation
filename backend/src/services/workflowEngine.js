const axios = require('axios');

/**
 * Execute a single node
 */
const executeNode = async (node, context) => {
  console.log(`[Engine] Executing Node: ${node.id} (${node.type})`);
  
  const config = node.data?.config || {};

  switch (node.type) {
    case 'webhook':
      // The webhook node just passes the context through
      console.log(`[Engine] Webhook received payload`);
      return context;

    case 'log':
      console.log(`[Engine] Log Node:`, config.message);
      return context;

    case 'delay':
      const seconds = config.seconds || 0;
      console.log(`[Engine] Delay Node: Waiting ${seconds} seconds...`);
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      console.log(`[Engine] Delay Node: Resumed`);
      return context;

    case 'http':
      const method = config.method || 'GET';
      const url = config.url;
      console.log(`[Engine] HTTP Node: Sending ${method} to ${url}`);
      
      if (url) {
        try {
          const response = await axios({ method, url, data: context.payload });
          console.log(`[Engine] HTTP Node Success: Status ${response.status}`);
          // Add response to context if needed
          return { ...context, lastHttpResponse: response.data };
        } catch (error) {
          console.error(`[Engine] HTTP Node Error:`, error.message);
        }
      } else {
        console.log(`[Engine] HTTP Node Skipped: No URL configured`);
      }
      return context;

    default:
      console.log(`[Engine] Unknown node type: ${node.type}`);
      return context;
  }
};

/**
 * Run the entire workflow
 */
const executeWorkflow = async (workflow, triggerPayload) => {
  console.log(`\n======================================`);
  console.log(`[Engine] Starting Workflow: ${workflow.name}`);
  console.log(`======================================`);

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
    return;
  }

  // 3. Helper to build node lookup
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // 4. Traverse sequentially starting from the webhook nodes
  // For simplicity, we'll process branches recursively using BFS/DFS.
  // We'll use a queue to handle BFS traversal.
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
    const nextContext = await executeNode(node, context);
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

  console.log(`[Engine] Workflow execution completed.\n`);
};

module.exports = {
  executeWorkflow
};
