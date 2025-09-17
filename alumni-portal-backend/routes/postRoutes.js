const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, commentOnPost } = require('../controllers/postController');
const { protect, isAlumni } = require('../middleware/authMiddleware');

router.route('/').post(protect, isAlumni, createPost).get(protect, getPosts);
router.route('/:id/like').put(protect, likePost);
router.route('/:id/comment').post(protect, commentOnPost);

module.exports = router;