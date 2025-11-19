import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, backendUrl } = useContext(AppContext);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'members'
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '' });
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    if (user && token && id) {
      fetchGroupDetails();
    }
  }, [user, token, id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/group/${id}`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setGroup(response.data.group);
      } else {
        toast.error(response.data.message);
        navigate('/groups');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/group/${id}/leave`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Left group successfully');
        navigate('/groups');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      const response = await axios.delete(`${backendUrl}/api/group/${id}`, {
        headers: { token }
      });

      if (response.data.success) {
        toast.success('Group deleted successfully');
        navigate('/groups');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.content.trim()) {
      toast.error('Please write something');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/group/${id}/post`,
        newPost,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Post created!');
        setNewPost({ content: '', imageUrl: '' });
        fetchGroupDetails();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/group/${id}/post/${postId}/like`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/group/${id}/post/${postId}/comment`,
        { text },
        { headers: { token } }
      );

      if (response.data.success) {
        setCommentText({ ...commentText, [postId]: '' });
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const isAdmin = group?.admin?._id === user?._id;
  const isMember = group?.members?.some(m => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId === user?._id;
  });

  console.log('Group members:', group?.members);
  console.log('Current user ID:', user?._id);
  console.log('Is member:', isMember);
  console.log('Is admin:', isAdmin);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-10 md:px-14 lg:px-28 py-8">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {group.coverImage ? (
              <img src={group.coverImage} alt={group.name} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-3xl">
                📚
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                <span>📁 {group.category}</span>
                <span>👥 {group.members?.length || 0} members</span>
                <span>💬 {group.posts?.length || 0} posts</span>
                {group.privacy === 'private' && <span className="bg-gray-700 px-2 py-1 rounded">🔒 Private</span>}
              </div>
              <p className="text-gray-300">{group.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Admin: {group.admin?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Group
              </button>
            )}
            {isMember && !isAdmin && (
              <button
                onClick={handleLeaveGroup}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Leave Group
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-t border-gray-700 pt-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'members'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Members ({group.members?.length || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        <div>
          {/* Create Post */}
          {isMember && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Share with the group</h2>
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  rows="4"
                  placeholder="Share your thoughts, book recommendations, or start a discussion..."
                />
                <input
                  type="text"
                  value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="Image URL (optional)"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Post
                </button>
              </form>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {group.posts && group.posts.length > 0 ? (
              [...group.posts].reverse().map((post) => (
                <div key={post._id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      {post.author?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{post.author?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" className="w-full max-h-96 object-cover rounded-lg mb-4" />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 border-t border-gray-700 pt-4">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`flex items-center gap-2 ${
                        post.likes?.includes(user?._id) ? 'text-blue-500' : 'text-gray-400'
                      } hover:text-blue-500 transition-colors`}
                    >
                      👍 {post.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => setShowComments({ ...showComments, [post._id]: !showComments[post._id] })}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      💬 {post.comments?.length || 0}
                    </button>
                  </div>

                  {/* Comments */}
                  {showComments[post._id] && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {post.comments.map((comment, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-gray-700 p-3 rounded">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm">
                                {comment.user?.name?.[0] || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{comment.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-300">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isMember && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText[post._id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Write a comment..."
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                          />
                          <button
                            onClick={() => handleComment(post._id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 mb-4">No posts yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Members Tab */
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Group Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-3 bg-gray-700 p-4 rounded-lg">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-lg">
                  {member.name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="text-sm text-gray-400">@{member.username}</p>
                  {member._id === group.admin._id && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded mt-1 inline-block">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
