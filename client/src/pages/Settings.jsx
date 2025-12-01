import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { backendUrl, token, user, fetchUser, setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Account Deletion State
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  });
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    console.log('[handleProfileUpdate] Starting profile update');
    console.log('[handleProfileUpdate] Profile data:', profileData);
    
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profileData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    try {
      console.log('[handleProfileUpdate] Sending request to:', `${backendUrl}/api/user/profile`);
      const response = await axios.put(
        `${backendUrl}/api/user/profile`,
        profileData,
        { headers: { token } }
      );

      console.log('[handleProfileUpdate] Response:', response.data);

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        await fetchUser();
        setIsEditingProfile(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to update profile');
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    console.log('[handlePasswordChange] Starting password change');
    console.log('[handlePasswordChange] Has currentPassword:', !!passwordData.currentPassword);
    console.log('[handlePasswordChange] Has newPassword:', !!passwordData.newPassword);
    console.log('[handlePasswordChange] Has confirmPassword:', !!passwordData.confirmPassword);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      console.log('[handlePasswordChange] Sending request to:', `${backendUrl}/api/user/change-password`);
      console.log('[handlePasswordChange] Token present:', !!token);
      
      const response = await axios.put(
        `${backendUrl}/api/user/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { token } }
      );

      console.log('[handlePasswordChange] Response:', response.data);

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Password change error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  // Handle Account Deletion
  const handleAccountDelete = async (e) => {
    e.preventDefault();

    if (deleteData.confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!deleteData.password) {
      toast.error('Please enter your password');
      return;
    }

    const finalConfirm = window.confirm(
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.'
    );

    if (!finalConfirm) return;

    try {
      const response = await axios.delete(
        `${backendUrl}/api/user/account`,
        {
          headers: { token },
          data: deleteData
        }
      );

      if (response.data.success) {
        toast.success('Account deleted successfully');
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Profile Settings Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-white text-lg">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Username</label>
                <p className="text-white text-lg">@{user?.username}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white text-lg">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Bio</label>
                <p className="text-white">{user?.bio || 'No bio added yet'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email (cannot be changed)</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-600 text-gray-400 border border-gray-600 rounded-lg cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio (max 500 characters)</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px]"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{profileData.bio.length}/500 characters</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Profile Picture URL (optional)</label>
                <input
                  type="text"
                  value={profileData.profilePicture}
                  onChange={(e) => setProfileData({ ...profileData, profilePicture: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
              <p className="text-sm text-gray-400 mt-1">Update your password to keep your account secure</p>
            </div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter new password (min 8 characters)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must contain uppercase, lowercase, and number
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                Update Password
              </button>
            </form>
          )}
        </div>

        {/* Danger Zone - Account Deletion */}
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-red-400">Danger Zone</h2>
              <p className="text-sm text-gray-400 mt-1">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteSection(!showDeleteSection)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {showDeleteSection ? 'Cancel' : 'Delete Account'}
            </button>
          </div>

          {showDeleteSection && (
            <form onSubmit={handleAccountDelete} className="space-y-4 mt-4">
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
                <p className="text-gray-300 text-sm">
                  Deleting your account will permanently remove:
                </p>
                <ul className="list-disc list-inside text-gray-300 text-sm ml-4 mt-2">
                  <li>Your profile and personal information</li>
                  <li>All your posts and comments</li>
                  <li>All your book reviews and ratings</li>
                  <li>Your reading lists</li>
                  <li>Your followers and following connections</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Enter your password</label>
                <input
                  type="password"
                  value={deleteData.password}
                  onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteData.confirmText}
                  onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="Type DELETE"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                disabled={deleteData.confirmText !== 'DELETE'}
              >
                I understand, delete my account permanently
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
