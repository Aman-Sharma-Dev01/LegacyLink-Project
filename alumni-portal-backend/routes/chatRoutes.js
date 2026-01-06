const express = require("express");
const { chatWithBot } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const { validateChatMessage } = require("../middleware/validators");
const { chatLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// POST /api/chat - Protected with auth, validation, and rate limiting
router.post("/", protect, chatLimiter, validateChatMessage, chatWithBot);

module.exports = router;
