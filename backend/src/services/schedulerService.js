const cron = require('node-cron');
const Workflow = require('../models/Workflow');
const { workflowQueue } = require('./workflowQueue');

// Store active cron tasks in memory so we can manage them
const activeJobs = new Map();

/**
 * Loads all active scheduled workflows and registers them with node-cron.
 * If schedules already exist in memory, it clears them first to ensure fresh state.
 */
const reloadSchedules = async () => {
  console.log('[Scheduler] Reloading workflow schedules...');

  // 1. Stop and clear all currently running cron tasks
  for (const [workflowId, task] of activeJobs.entries()) {
    task.stop();
  }
  activeJobs.clear();

  try {
    // 2. Fetch all active workflows that have a schedule enabled
    const scheduledWorkflows = await Workflow.find({ 
      isActive: true,
      'schedule.enabled': true 
    });

    // 3. Register a cron task for each
    scheduledWorkflows.forEach((workflow) => {
      const cronExpr = workflow.schedule?.cronExpression;
      
      // Validate cron expression
      if (!cronExpr || !cron.validate(cronExpr)) {
        console.warn(`[Scheduler] Invalid cron expression for workflow ${workflow._id}: ${cronExpr}`);
        return;
      }

      // Schedule the job
      const task = cron.schedule(cronExpr, async () => {
        console.log(`[Scheduler] Firing scheduled job for workflow ${workflow._id}`);
        try {
          // Add job to BullMQ
          await workflowQueue.add('execute-workflow', {
            workflowId: workflow._id,
            payload: { trigger: 'schedule', timestamp: new Date().toISOString() }
          }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false
          });
        } catch (error) {
          console.error(`[Scheduler] Error enqueueing job for workflow ${workflow._id}:`, error);
        }
      });

      // Save reference to active job map
      activeJobs.set(workflow._id.toString(), task);
    });

    console.log(`[Scheduler] Successfully loaded ${activeJobs.size} scheduled workflows.`);
  } catch (error) {
    console.error('[Scheduler] Error reloading schedules:', error);
  }
};

module.exports = {
  reloadSchedules
};
