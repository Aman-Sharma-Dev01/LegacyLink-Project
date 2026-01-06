const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, deleteJob } = require('../controllers/jobController');
const { protect, isAlumni } = require('../middleware/authMiddleware');
const { validateJob, validatePagination, validateMongoId } = require('../middleware/validators');

// @route   /api/jobs
router
  .route('/')
  .post(protect, isAlumni, validateJob, createJob)
  .get(protect, validatePagination, getAllJobs);

// @route   /api/jobs/:id
router
  .route('/:id')
  .delete(protect, isAlumni, validateMongoId, deleteJob);

module.exports = router;