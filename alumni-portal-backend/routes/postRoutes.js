const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, commentOnPost, getPostsByUser, deletePost } = require('../controllers/postController');
const { protect, isAlumni } = require('../middleware/authMiddleware');
router.route('/user/:userId').get(protect, getPostsByUser);
router.route('/').post(protect, isAlumni, createPost).get(protect, getPosts);
router.route('/:id/like').put(protect, likePost);
router.route('/:id/comment').post(protect, commentOnPost);
router.route('/:id').delete(protect, deletePost);

module.exports = router;