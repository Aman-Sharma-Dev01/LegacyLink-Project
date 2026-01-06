const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, commentOnPost, getPostsByUser, deletePost, editPost, getPostById } = require('../controllers/postController');
const { protect, isAlumni } = require('../middleware/authMiddleware');
const { validatePost, validateComment, validatePagination, validateMongoId } = require('../middleware/validators');
const { postLimiter } = require('../middleware/rateLimiter');

router.route('/user/:userId').get(protect, getPostsByUser);
router.route('/')
  .post(protect, isAlumni, postLimiter, validatePost, createPost)
  .get(protect, validatePagination, getPosts);
router.route('/:id/like').put(protect, validateMongoId, likePost);
router.route('/:id/comment').post(protect, validateMongoId, validateComment, commentOnPost);
router.route('/:id')
  .get(protect, validateMongoId, getPostById)
  .put(protect, validateMongoId, validatePost, editPost)
  .delete(protect, validateMongoId, deletePost);

module.exports = router;