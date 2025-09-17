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

module.exports = { createPost, getPosts, likePost, commentOnPost };