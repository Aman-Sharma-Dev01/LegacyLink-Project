const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { validateMongoId, validatePagination } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

router.get('/', validatePagination, getNotifications);
router.get('/count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.delete('/clear', clearReadNotifications);
router.put('/:id/read', validateMongoId, markAsRead);
router.delete('/:id', validateMongoId, deleteNotification);

module.exports = router;
