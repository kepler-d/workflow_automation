const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} = require('../controllers/workflowController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWorkflows)
  .post(protect, createWorkflow);

router.route('/:id')
  .get(protect, getWorkflow)
  .put(protect, updateWorkflow)
  .delete(protect, deleteWorkflow);

module.exports = router;
