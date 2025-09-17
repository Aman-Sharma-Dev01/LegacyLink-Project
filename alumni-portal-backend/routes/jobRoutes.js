const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, deleteJob } = require('../controllers/jobController');
const { protect, isAlumni } = require('../middleware/authMiddleware');

// @route   /api/jobs
router
  .route('/')
  .post(protect, isAlumni, createJob) // Alumni can create jobs
  .get(protect, getAllJobs); // Any logged-in user can view jobs

// @route   /api/jobs/:id
router
  .route('/:id')
  .delete(protect, isAlumni, deleteJob); // Only the alumni who posted can delete

module.exports = router;