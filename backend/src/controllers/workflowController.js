const Workflow = require('../models/Workflow');
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

    const workflow = await Workflow.create({
      name,
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

module.exports = {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
