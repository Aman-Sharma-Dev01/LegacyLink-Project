import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI, uploadAPI } from '../services/api'
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2, Loader2, Image, X, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const Feed = () => {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, hasMore: true })
  const fileInputRef = useRef(null)
  const { user, isAlumni } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async (page = 1) => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)
      
      const response = await postsAPI.getAll({ page, limit: 10 })
      const { posts: newPosts, pagination: paginationData } = response.data
      
      if (page === 1) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      setPagination({
        page: paginationData.page,
        hasMore: paginationData.hasMore
      })
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchPosts(pagination.page + 1)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload to cloudinary
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await uploadAPI.postImage(formData)
      setPostImage(data.imageUrl)
      toast.success('Image uploaded!')
    } catch (error) {
      console.error('Error uploading image:', error)
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setPostImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() && !postImage) return

    setPosting(true)
    try {
      const response = await postsAPI.create({ 
        text: newPost,
        image: postImage 
      })
      setPosts([response.data, ...posts])
      setNewPost('')
      setPostImage(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Post created successfully!')
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setPosting(false)
    }
  }

  const handleEditPost = async (postId, text, image) => {
    try {
      const { data } = await postsAPI.update(postId, { text, image })
      setPosts(posts.map(post => post._id === postId ? data : post))
      toast.success('Post updated!')
    } catch (error) {
      console.error('Error updating post:', error)
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
      // Update the post with new comment locally instead of refetching all
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [
              { text: commentText, user: user._id, name: user.name, _id: Date.now() },
              ...post.comments
            ]
          }
        }
        return post
      }))
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
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 rounded-lg object-cover"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      ref={fileInputRef}
                      className="hidden"
                      id="post-image-input"
                    />
                    <label
                      htmlFor="post-image-input"
                      className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <Image className="w-5 h-5" />
                      <span className="text-sm">Photo</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {newPost.length}/280
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={(!newPost.trim() && !postImage) || posting || uploadingImage}
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
              onEdit={handleEditPost}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {pagination.hasMore && posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary px-6 py-2 disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </span>
            ) : (
              'Load More Posts'
            )}
          </button>
        </div>
      )}

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

const PostCard = ({ post, currentUser, onLike, onComment, onDelete, onEdit }) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  
  const isLiked = post.likes.includes(currentUser._id)
  const canDelete = post.user?._id === currentUser._id || currentUser.role === 'Institute_Admin';
  const canEdit = post.user?._id === currentUser._id;


  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    onComment(post._id, commentText)
    setCommentText('')
  }

  const handleEditSubmit = () => {
    if (!editText.trim()) return
    onEdit(post._id, editText, post.image)
    setIsEditing(false)
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
            <div className="text-sm text-gray-500"> <span className=' font-medium text-xs'>  
              {`Batch: ${post.user.profile?.graduationYear || 'Unknown Year'}`} </span>
              {` - ${new Date(post.createdAt).toLocaleDateString()}`}
            </div>
          </div>
        </div>

        {(canDelete || canEdit) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border py-1 z-10">
                {canEdit && (
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setEditText(post.text)
                      setShowMenu(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                )}
                {canDelete && (
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
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 text-sm bg-linkedin-blue text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-900 leading-relaxed">{post.text}</p>
            {post.image && (
              <div className="mt-3">
                <img 
                  src={post.image} 
                  alt="Post" 
                  className="rounded-lg max-h-96 w-full object-cover"
                />
              </div>
            )}
          </>
        )}
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