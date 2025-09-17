const Post = require('../models/postModel');
const User = require('../models/userModel');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private/Alumni
const createPost = async (req, res) => {
    const { text } = req.body;

    const post = new Post({
        text: text,
        user: req.user._id,
    });

    const createdPost = await post.save();
    res.status(201).json(createdPost);
};

// @desc    Get all posts for the feed
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
    const posts = await Post.find({}).populate('user', 'name profile').sort({ createdAt: -1 });
    res.json(posts);
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (post) {
        // Check if the post has already been liked by this user
        if (post.likes.some(like => like.toString() === req.user._id.toString())) {
             post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }
        await post.save();
        res.json({ message: 'Post like toggled' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (post) {
        const comment = {
            text: text,
            user: req.user._id,
            name: req.user.name,
        };

        post.comments.unshift(comment);
        await post.save();
        res.status(201).json({ message: 'Comment added' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
};
// ... (keep your existing functions: createPost, getPosts, etc.)

// @desc    Get all posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Private
const getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name profile')
      .sort({ createdAt: -1 });
      
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: 'User posts not found' });
  }
};
// ...existing code...

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (only post owner or admin)

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Allow delete if user is post owner or admin
        if (
            post.user.toString() !== req.user._id.toString() &&
            !req.user.isAdmin
        ) {
            return res.status(401).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne(); // <-- Use this instead of post.remove()
        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ...existing code...

module.exports = { createPost, getPosts, likePost, commentOnPost, getPostsByUser, deletePost };

