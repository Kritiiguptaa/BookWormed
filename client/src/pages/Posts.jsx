import React, { useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import CreatePost from '../components/CreatePost';
import PostFeed from '../components/PostFeed';

const Posts = () => {
  const { user, setShowLogin } = useContext(AppContext);
  const postFeedRef = useRef(null);

  const handlePostCreated = () => {
    // Refresh the feed when a new post is created
    if (postFeedRef.current) {
      // Trigger a refresh by remounting the PostFeed component
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Posts
          </h1>
          <p className="text-gray-400">Share your thoughts with the community</p>
        </div>

        {/* Create Post Section - Only show if user is logged in */}
        {user ? (
          <CreatePost onPostCreated={handlePostCreated} />
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-6 text-center">
            <p className="text-gray-300 mb-4">
              Join the conversation! Login to create posts and interact with the community.
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Login Now
            </button>
          </div>
        )}

        {/* Posts Feed */}
        <PostFeed ref={postFeedRef} />
      </div>

      {/* Info Footer */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-400 mb-2">Community Guidelines</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Be respectful and kind to others</li>
            <li>• Share meaningful content</li>
            <li>• No spam or self-promotion</li>
            <li>• Keep discussions constructive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Posts;
