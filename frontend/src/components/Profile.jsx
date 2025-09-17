import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI, postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Edit2, 
  Save, 
  X, 
  MessageSquare, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Heart, 
  Trash2, 
  Send 
} from 'lucide-react';

// Main Profile Component
const Profile = () => {
  const { user: currentUser } = useAuth(); // The currently logged-in user
  const [profileUser, setProfileUser] = useState(null); // The user whose profile is being displayed
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await userAPI.getProfile();
        setProfileUser(data);
        setFormData({
          name: data.name || '',
          headline: data.profile.headline || '',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          graduationYear: data.profile.graduationYear || '',
          company: data.profile.company || '',
          jobTitle: data.profile.jobTitle || '',
          major: data.profile.major || '',
          expectedGraduationYear: data.profile.expectedGraduationYear || '',
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Updating profile...');
    try {
      const { data: updatedUser } = await userAPI.updateProfile(formData);
      setProfileUser(updatedUser);
      toast.success('Profile updated successfully!', { id: loadingToast });
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile.', { id: loadingToast });
    }
  };
  
  const handleCancelEdit = () => {
    setFormData({
      name: profileUser.name || '',
      headline: profileUser.profile.headline || '',
      bio: profileUser.profile.bio || '',
      location: profileUser.profile.location || '',
      graduationYear: profileUser.profile.graduationYear || '',
      company: profileUser.profile.company || '',
      jobTitle: profileUser.profile.jobTitle || '',
      major: profileUser.profile.major || '',
      expectedGraduationYear: profileUser.profile.expectedGraduationYear || '',
    });
    setEditMode(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="text-center py-20">Loading Profile...</div>;
  if (!profileUser) return <div className="text-center py-20 text-red-500">Could not load profile.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <img
              src={`https://ui-avatars.com/api/?name=${profileUser.name}&background=0D6EFD&color=fff&size=128`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-sm"
            />
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-gray-900">{profileUser.name}</h1>
              <p className="text-gray-600">{profileUser.profile.headline || 'No headline'}</p>
              <p className="text-sm text-gray-500">{profileUser.email} • <span className="font-semibold">{profileUser.role.replace('_', ' ')}</span></p>
            </div>
          </div>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn-secondary flex-shrink-0">
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton name="About" tabId="about" activeTab={activeTab} setActiveTab={setActiveTab} />
          {profileUser.role === 'Alumni' && (
            <TabButton name="Posts" tabId="posts" activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {editMode ? (
              <EditProfileForm
                formData={formData}
                onInputChange={handleInputChange}
                onUpdate={handleUpdateProfile}
                onCancel={handleCancelEdit}
                userRole={profileUser.role}
              />
            ) : activeTab === 'about' ? (
              <AboutSection user={profileUser} />
            ) : (
              <PostList userId={profileUser._id} currentUser={currentUser} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const TabButton = ({ name, tabId, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tabId)}
    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === tabId ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
  >
    {name}
  </button>
);

const AboutSection = ({ user }) => (
  <div className="space-y-6">
    <InfoBlock title="Bio" content={user.profile.bio || 'No bio provided.'} />
    {user.profile.location && <InfoItem icon={<MapPin size={16}/>} label="Location" value={user.profile.location}/>}
    
    {user.role === 'Alumni' && (
      <div className="border-t pt-4 space-y-2">
        <InfoItem icon={<Briefcase size={16}/>} label="Company" value={user.profile.company || 'N/A'}/>
        <InfoItem icon={<GraduationCap size={16}/>} label="Graduated" value={user.profile.graduationYear || 'N/A'}/>
      </div>
    )}
    {user.role === 'Student' && (
       <div className="border-t pt-4 space-y-2">
        <InfoItem icon={<Briefcase size={16}/>} label="Major" value={user.profile.major || 'N/A'}/>
        <InfoItem icon={<Calendar size={16}/>} label="Expected Graduation" value={user.profile.expectedGraduationYear || 'N/A'}/>
      </div>
    )}
  </div>
);

const EditProfileForm = ({ formData, onInputChange, onUpdate, onCancel, userRole }) => {
  const commonFields = [
    { name: 'name', label: 'Full Name' }, { name: 'headline', label: 'Headline' }, { name: 'location', label: 'Location' }
  ];
  const roleSpecificFields = userRole === 'Alumni'
    ? [{ name: 'company', label: 'Company' }, { name: 'jobTitle', label: 'Job Title' }, { name: 'graduationYear', label: 'Graduation Year', type: 'number' }]
    : userRole === 'Student'
    ? [{ name: 'major', label: 'Major' }, { name: 'expectedGraduationYear', label: 'Expected Graduation', type: 'number' }]
    : [];

  return (
    <form onSubmit={onUpdate} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
      {[...commonFields, ...roleSpecificFields].map(field => <FormInput key={field.name} {...field} value={formData[field.name]} onChange={onInputChange} />)}
      <FormInput name="bio" label="Bio" type="textarea" value={formData.bio} onChange={onInputChange} />
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary"><X size={16}/> Cancel</button>
        <button type="submit" className="btn-primary"><Save size={16}/> Save Changes</button>
      </div>
    </form>
  );
};

const FormInput = ({ name, label, type = 'text', value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {type === 'textarea'
      ? <textarea id={name} name={name} value={value} onChange={onChange} rows="3" className="input-field" />
      : <input id={name} name={name} type={type} value={value} onChange={onChange} className="input-field" />}
  </div>
);

const PostList = ({ userId, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const { data } = await postsAPI.getPostsByUser(userId);
        setPosts(data);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [userId]);

  const handleLike = async (postId) => {
    const originalPosts = [...posts];
    setPosts(posts.map(p => p._id === postId ? { ...p, likes: p.likes.includes(currentUser._id) ? p.likes.filter(id => id !== currentUser._id) : [...p.likes, currentUser._id] } : p));
    try { await postsAPI.like(postId); } catch (error) { setPosts(originalPosts); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await postsAPI.delete(postId);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success("Post deleted.");
    } catch (error) { console.error("Failed to delete post:", error); }
  };
  
  const handleComment = async (postId, text) => {
    try {
      const { data: updatedPost } = await postsAPI.comment(postId, { text });
      setPosts(posts.map(p => p._id === postId ? updatedPost : p));
      toast.success("Comment added.");
    } catch (error) { console.error("Failed to add comment:", error); }
  };

  if (loading) return <div>Loading posts...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Posts</h2>
      {posts.length > 0 ? (
        posts.map(post => (
          <ProfilePostCard 
            key={post._id} 
            post={post} 
            currentUser={currentUser}
            onLike={handleLike}
            onDelete={handleDelete}
            onComment={handleComment}
          />
        ))
      ) : (
        <div className="text-center py-10">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">This user hasn't posted anything yet.</p>
        </div>
      )}
    </div>
  );
};

const ProfilePostCard = ({ post, currentUser, onLike, onDelete, onComment }) => {
    const [commentText, setCommentText] = useState('');
    const isLiked = post.likes.includes(currentUser._id);
    const canDelete = post.user._id === currentUser._id;

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onComment(post._id, commentText);
        setCommentText('');
    };

    return (
        <div className="p-4 border rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
            <p className="text-xs text-gray-400 mt-2 mb-3">{new Date(post.createdAt).toLocaleString()}</p>
            
            <div className="flex items-center justify-between border-t pt-2">
                <div className="flex items-center gap-4">
                    <button onClick={() => onLike(post._id)} className={`flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                        <Heart size={16} className={isLiked ? 'fill-current' : ''}/> {post.likes.length}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare size={16}/> {post.comments.length}
                    </span>
                </div>
                {canDelete && (
                    <button onClick={() => onDelete(post._id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>
            
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-3">
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="input-field text-sm"
                />
                <button type="submit" disabled={!commentText.trim()} className="btn-primary p-2 text-sm">
                    <Send size={16}/>
                </button>
            </form>
        </div>
    );
};

const InfoBlock = ({ title, content }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-700 leading-relaxed">{content}</p>
    </div>
);

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <p className="text-gray-700"><span className="font-semibold">{label}:</span> {value}</p>
    </div>
);

export default Profile;