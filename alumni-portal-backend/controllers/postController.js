const Post = require('../models/postModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private/Alumni
const createPost = async (req, res) => {
  try {
    const { text, image } = req.body;

    const post = new Post({
      text: text,
      image: image || null,
      user: req.user._id,
    });

    const createdPost = await post.save();
    
    // Populate user info before returning
    await createdPost.populate('user', 'name profile');
    
    res.status(201).json(createdPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating post' });
  }
};

// @desc    Get all posts for the feed (with pagination)
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({})
      .populate('user', 'name profile')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Post.countDocuments({});

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    const post = await Post.findById(req.params.id).populate('user', 'name');

    if (post) {
        // Check if the post has already been liked by this user
        if (post.likes.some(like => like.toString() === req.user._id.toString())) {
             post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
            
            // Create notification for post owner (if not liking own post)
            if (post.user._id.toString() !== req.user._id.toString()) {
              await Notification.createNotification({
                recipient: post.user._id,
                sender: req.user._id,
                type: 'like',
                title: 'New Like',
                message: `${req.user.name} liked your post`,
                link: `/posts/${post._id}`,
                relatedPost: post._id,
              });
            }
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
    const post = await Post.findById(req.params.id).populate('user', 'name');

    if (post) {
        const comment = {
            text: text,
            user: req.user._id,
            name: req.user.name,
        };

        post.comments.unshift(comment);
        await post.save();
        
        // Create notification for post owner (if not commenting on own post)
        if (post.user._id.toString() !== req.user._id.toString()) {
          await Notification.createNotification({
            recipient: post.user._id,
            sender: req.user._id,
            type: 'comment',
            title: 'New Comment',
            message: `${req.user.name} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
            link: `/posts/${post._id}`,
            relatedPost: post._id,
          });
        }
        
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

// @desc    Edit a post
// @route   PUT /api/posts/:id
// @access  Private (only post owner)
const editPost = async (req, res) => {
    try {
        const { text, image } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Only post owner can edit
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this post' });
        }

        // Update fields
        if (text !== undefined) post.text = text;
        if (image !== undefined) post.image = image;

        const updatedPost = await post.save();
        await updatedPost.populate('user', 'name profile');

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating post' });
    }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', 'name profile')
            .populate('comments.user', 'name profile');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching post' });
    }
};

// ...existing code...

module.exports = { createPost, getPosts, likePost, commentOnPost, getPostsByUser, deletePost, editPost, getPostById };

