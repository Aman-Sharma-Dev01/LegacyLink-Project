const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getUserGrowthTrend,
  getEngagementMetrics,
  getTopContributors,
  getMentorshipStats,
  getSkillDistribution,
} = require('../controllers/analyticsController');
const { protect, isInstituteAdmin } = require('../middleware/authMiddleware');

// All analytics routes require admin access
router.use(protect, isInstituteAdmin);

router.get('/overview', getOverviewStats);
router.get('/user-growth', getUserGrowthTrend);
router.get('/engagement', getEngagementMetrics);
router.get('/top-contributors', getTopContributors);
router.get('/mentorship', getMentorshipStats);
router.get('/skills', getSkillDistribution);

module.exports = router;
