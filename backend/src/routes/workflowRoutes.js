const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowRuns,
  getRunLogs,
  getAllUserRuns,
} = require('../controllers/workflowController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWorkflows)
  .post(protect, createWorkflow);

router.route('/runs/all')
  .get(protect, getAllUserRuns);

router.route('/runs/:runId/logs')
  .get(protect, getRunLogs);

router.route('/:id/runs')
  .get(protect, getWorkflowRuns);

router.route('/:id')
  .get(protect, getWorkflow)
  .put(protect, updateWorkflow)
  .delete(protect, deleteWorkflow);

module.exports = router;
