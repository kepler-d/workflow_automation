const { Worker } = require('bullmq');
const { connection } = require('./workflowQueue');
const { executeWorkflow } = require('./workflowEngine');
const Workflow = require('../models/Workflow');

const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    const { workflowId, payload } = job.data;
    console.log(`[Worker] Picked up job ${job.id} for workflow ${workflowId}`);

    // Fetch the latest workflow definition from the database
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      console.error(`[Worker] Workflow ${workflowId} not found`);
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      console.log(`[Worker] Workflow ${workflowId} is inactive, skipping execution.`);
      return { skipped: true, reason: 'inactive' };
    }

    // Call the execution engine
    await executeWorkflow(workflow, payload);
    
    console.log(`[Worker] Successfully executed job ${job.id}`);
    return { success: true };
  },
  { connection }
);

workflowWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} has completed!`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} has failed with ${err.message}`);
});

module.exports = workflowWorker;
