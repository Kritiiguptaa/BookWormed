import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Groups = () => {
  const { user, token, backendUrl, setShowLogin } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('my-groups'); // 'my-groups' or 'discover'
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    coverImage: '',
    category: 'General',
    privacy: 'public'
  });

  const categories = [
    'General', 'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 
    'Science Fiction', 'Fantasy', 'Horror', 'Biography', 'Self-Help', 
    'Business', 'Academic', 'Poetry', 'Other'
  ];

  useEffect(() => {
    if (user && token) {
      fetchMyGroups();
      fetchAllGroups();
    }
  }, [user, token]);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/group/user`, {
        headers: { token }
      });
      if (response.data.success) {
        setMyGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Error fetching my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/group/all`, {
        headers: { token }
      });
      if (response.data.success) {
        setAllGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Error fetching all groups:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroup.name || !newGroup.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/group/create`,
        newGroup,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Group created successfully!');
        setShowCreateModal(false);
        setNewGroup({
          name: '',
          description: '',
          coverImage: '',
          category: 'General',
          privacy: 'public'
        });
        fetchMyGroups();
        fetchAllGroups();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/group/${groupId}/join`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Joined group successfully!');
        fetchMyGroups();
        fetchAllGroups();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  const getGroupCategoryEmoji = (category) => {
    const emojiMap = {
      'General': '📚',
      'Fiction': '📖',
      'Non-Fiction': '📰',
      'Mystery': '🔍',
      'Romance': '💕',
      'Science Fiction': '🚀',
      'Fantasy': '🐉',
      'Horror': '👻',
      'Biography': '👤',
      'Self-Help': '💡',
      'Business': '💼',
      'Academic': '🎓',
      'Poetry': '✍️',
      'Other': '📕'
    };
    return emojiMap[category] || '📚';
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-10 md:px-14 lg:px-28 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Join BookWormed to Access Groups</h2>
          <p className="text-gray-400 mb-6">
            Connect with fellow readers, discuss books, and share your thoughts in groups!
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 sm:px-10 md:px-14 lg:px-28 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📚 Book Discussion Groups</h1>
            <p className="text-gray-400">Connect with readers, discuss books, and share ideas</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span> Create Group
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'my-groups'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'discover'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover Groups
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {/* My Groups Tab */}
          {activeTab === 'my-groups' && (
            <div>
              {myGroups.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                  <p className="text-gray-400 mb-4">You haven't joined any groups yet</p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Discover Groups
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myGroups.map((group) => (
                    <Link
                      key={group._id}
                      to={`/groups/${group._id}`}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-4xl">{getGroupCategoryEmoji(group.category)}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{group.name}</h3>
                          <p className="text-sm text-gray-400">{group.category}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">
                            👥 {group.members?.length || 0} members
                          </span>
                          <span className="text-gray-400">
                            💬 {group.posts?.length || 0} posts
                          </span>
                        </div>
                        {group.privacy === 'private' && (
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">🔒 Private</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allGroups
                .filter(group => !myGroups.some(mg => mg._id === group._id))
                .map((group) => (
                  <div
                    key={group._id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">{getGroupCategoryEmoji(group.category)}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{group.name}</h3>
                        <p className="text-sm text-gray-400">{group.category}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                          👥 {group.members?.length || 0} members
                        </span>
                        <span className="text-gray-400">
                          💬 {group.posts?.length || 0} posts
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group._id)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Join Group
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mystery Lovers Club"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Description *</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Tell people what this group is about..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Category</label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getGroupCategoryEmoji(cat)} {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Cover Image URL (optional)</label>
                <input
                  type="text"
                  value={newGroup.coverImage}
                  onChange={(e) => setNewGroup({ ...newGroup, coverImage: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Privacy</label>
                <select
                  value={newGroup.privacy}
                  onChange={(e) => setNewGroup({ ...newGroup, privacy: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">🌐 Public (Anyone can join)</option>
                  <option value="private">🔒 Private (Invite only)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
