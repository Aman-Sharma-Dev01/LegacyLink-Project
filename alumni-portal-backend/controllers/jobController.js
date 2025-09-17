const Job = require('../models/jobModel');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private/Alumni
const createJob = async (req, res) => {
  const { title, company, location, description, jobType, applyLink } = req.body;

  const job = new Job({
    title,
    company,
    location,
    description,
    jobType,
    applyLink,
    postedBy: req.user._id,
  });

  const createdJob = await job.save();
  res.status(201).json(createdJob);
};

// @desc    Get all job postings
// @route   GET /api/jobs
// @access  Private (Students and others)
const getAllJobs = async (req, res) => {
  const jobs = await Job.find({})
    .populate('postedBy', 'name profile.company')
    .sort({ createdAt: -1 });
  res.json(jobs);
};

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private/Alumni
const deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  // Check if the user trying to delete the job is the one who posted it
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized to delete this job' });
  }

  await job.deleteOne(); // Use deleteOne() for Mongoose v6+
  res.json({ message: 'Job removed successfully' });
};

module.exports = { createJob, getAllJobs, deleteJob };