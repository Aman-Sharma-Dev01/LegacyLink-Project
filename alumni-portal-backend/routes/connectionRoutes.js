const express = require('express');
const router = express.Router();
const {
  sendConnectionRequest,
  respondToRequest,
  getPendingRequests,
  getSentRequests,
  getConnections,
  getConnectionStatus,
  removeConnection,
  cancelRequest,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');
const { validateConnectionId, validateUserId, validatePagination } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

router.post('/request', sendConnectionRequest);
router.put('/respond/:connectionId', validateConnectionId, respondToRequest);
router.get('/requests', getPendingRequests);
router.get('/sent', getSentRequests);
router.get('/', validatePagination, getConnections);
router.get('/status/:userId', validateUserId, getConnectionStatus);
router.delete('/cancel/:connectionId', validateConnectionId, cancelRequest);
router.delete('/:connectionId', validateConnectionId, removeConnection);

module.exports = router;
