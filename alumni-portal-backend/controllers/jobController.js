const Job = require('../models/jobModel');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private/Alumni
const createJob = async (req, res) => {
  try {
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
    await createdJob.populate('postedBy', 'name profile.company');
    
    res.status(201).json(createdJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating job' });
  }
};

// @desc    Get all job postings (with pagination and filtering)
// @route   GET /api/jobs
// @access  Private (Students and others)
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    let query = {};
    
    // Filter by job type
    if (req.query.jobType && ['Full-time', 'Part-time', 'Contract', 'Internship'].includes(req.query.jobType)) {
      query.jobType = req.query.jobType;
    }
    
    // Filter by location
    if (req.query.location) {
      query.location = new RegExp(req.query.location, 'i');
    }
    
    // Filter by company
    if (req.query.company) {
      query.company = new RegExp(req.query.company, 'i');
    }
    
    // Search by title or description
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { company: searchRegex }
      ];
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name profile.company')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
};

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private/Alumni
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user trying to delete the job is the one who posted it
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ message: 'Job removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting job' });
  }
};

module.exports = { createJob, getAllJobs, deleteJob };