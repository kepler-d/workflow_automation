const mongoose = require('mongoose');

const workflowRunSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed'],
      default: 'pending',
    },
    triggerPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkflowRun', workflowRunSchema);
