const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { validateConversationId, validatePagination } = require('../middleware/validators');
const { chatLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversation', getOrCreateConversation);
router.get('/conversation/:conversationId', validateConversationId, validatePagination, getMessages);
router.post('/send', chatLimiter, sendMessage);
router.put('/conversation/:conversationId/read', validateConversationId, markConversationRead);
router.get('/unread-count', getUnreadCount);
router.delete('/:conversationId/:messageId', deleteMessage);

module.exports = router;
