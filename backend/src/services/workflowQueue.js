const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Connect to Redis (uses REDIS_URI env var or defaults to localhost)
const connection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Create the workflow execution queue
const workflowQueue = new Queue('workflow-execution', { connection });

module.exports = {
  workflowQueue,
  connection
};
