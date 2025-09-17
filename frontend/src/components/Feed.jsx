import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const Feed = () => {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const { user, isAlumni } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await postsAPI.getAll()
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setPosting(true)
    try {
      const response = await postsAPI.create({ text: newPost })
      setPosts([response.data, ...posts])
      setNewPost('')
      toast.success('Post created successfully!')
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setPosting(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      await postsAPI.like(postId)
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(user._id)
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user._id)
              : [...post.likes, user._id]
          }
        }
        return post
      }))
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (postId, commentText) => {
    try {
      await postsAPI.comment(postId, { text: commentText })
      fetchPosts() // Refresh to get updated comments
      toast.success('Comment added!')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    
    try {
      await postsAPI.delete(postId)
      setPosts(posts.filter(post => post._id !== postId))
      toast.success('Post deleted successfully!')
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-300 rounded w-16"></div>
              <div className="h-8 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      {isAlumni && (
        <motion.div 
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleCreatePost}>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-linkedin-blue rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm text-gray-500">
                    {newPost.length}/280 characters
                  </div>
                  <button
                    type="submit"
                    disabled={!newPost.trim() || posting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{posting ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDeletePost}
            />
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">
            {isAlumni 
              ? "Be the first to share something with the community!" 
              : "Check back later for updates from alumni."}
          </p>
        </div>
      )}
    </div>
  )
}

const PostCard = ({ post, currentUser, onLike, onComment, onDelete }) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  
  const isLiked = post.likes.includes(currentUser._id)
  const canDelete = post.user?._id === currentUser._id || currentUser.role === 'Institute_Admin';


  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    onComment(post._id, commentText)
    setCommentText('')
  }

  return (
    <motion.div
      className="card p-6 hover-lift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-linkedin-blue rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {post.user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {post.user?.name || 'Alumni'}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border py-1 z-10">
                <button
                  onClick={() => {
                    onDelete(post._id)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed">{post.text}</p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center space-x-6 py-2 border-t">
        <button
          onClick={() => onLike(post._id)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            isLiked 
              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">{post.likes.length}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{post.comments?.length || 0}</span>
        </button>

        {/* <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button> */}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4 mt-4"
          >
            {/* Add Comment */}
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-linkedin-blue rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {currentUser?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
              >
                Post
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {post.comments?.map((comment, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="font-semibold text-sm text-gray-900">
                        {comment?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-700">{comment.text}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(comment.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Feed