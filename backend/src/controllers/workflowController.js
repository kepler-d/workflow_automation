const Workflow = require('../models/Workflow');
const WorkflowRun = require('../models/WorkflowRun');
const ExecutionLog = require('../models/ExecutionLog');
const { z } = require('zod');

const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// @desc    Get all workflows for logged in user
// @route   GET /api/workflows
// @access  Private
const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(workflows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get single workflow
// @route   GET /api/workflows/:id
// @access  Private
const getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Make sure the logged in user matches the workflow user
    if (workflow.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    return res.status(200).json(workflow);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const crypto = require('crypto');

// @desc    Create a workflow
// @route   POST /api/workflows
// @access  Private
const createWorkflow = async (req, res) => {
  try {
    const validationResult = workflowSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const { name, nodes = [], edges = [], isActive = true } = validationResult.data;

    // Generate a random webhook path like "welcome-flow-a7k29x"
    const randomHash = crypto.randomBytes(4).toString('hex');
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const webhookPath = `${safeName || 'workflow'}-${randomHash}`;

    const workflow = await Workflow.create({
      name,
      webhookPath,
      nodes,
      edges,
      isActive,
      userId: req.user.id,
    });

    return res.status(201).json(workflow);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a workflow
// @route   PUT /api/workflows/:id
// @access  Private
const updateWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Make sure the logged in user matches the workflow user
    if (workflow.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const validationResult = workflowSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const updatedWorkflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      validationResult.data,
      { new: true }
    );

    return res.status(200).json(updatedWorkflow);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a workflow
// @route   DELETE /api/workflows/:id
// @access  Private
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Make sure the logged in user matches the workflow user
    if (workflow.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await workflow.deleteOne();

    return res.status(200).json({ id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get execution runs for a workflow
// @route   GET /api/workflows/:id/runs
// @access  Private
const getWorkflowRuns = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow || workflow.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Workflow not found or unauthorized' });
    }

    const runs = await WorkflowRun.find({ workflow: req.params.id }).sort({ createdAt: -1 });
    return res.status(200).json(runs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed logs for a specific run
// @route   GET /api/workflows/runs/:runId/logs
// @access  Private
const getRunLogs = async (req, res) => {
  try {
    const run = await WorkflowRun.findById(req.params.runId).populate('workflow');
    if (!run || !run.workflow || run.workflow.userId.toString() !== req.user.id) {
       return res.status(404).json({ message: 'Run not found or unauthorized' });
    }

    const logs = await ExecutionLog.find({ run: req.params.runId }).sort({ createdAt: 1 });
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowRuns,
  getRunLogs,
};
