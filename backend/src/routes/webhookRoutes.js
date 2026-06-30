const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const { executeWorkflow } = require('../services/workflowEngine');

// @desc    Trigger a workflow via webhook
// @route   POST /api/webhooks/:webhookPath
// @access  Public
router.post('/:webhookPath', async (req, res) => {
  try {
    const { webhookPath } = req.params;

    // Find the workflow by its unique webhook token
    const workflow = await Workflow.findOne({ webhookPath });

    if (!workflow) {
      return res.status(404).json({ message: 'Webhook not found or invalid path' });
    }

    if (!workflow.isActive) {
      return res.status(400).json({ message: 'Workflow is currently inactive' });
    }

    // Acknowledge the webhook immediately so the caller doesn't wait for execution
    res.status(202).json({ message: 'Workflow triggered successfully' });

    // Start execution asynchronously in the background
    executeWorkflow(workflow, req.body).catch(err => {
      console.error(`[Engine Error] Workflow execution failed:`, err);
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error triggering webhook' });
  }
});

module.exports = router;
