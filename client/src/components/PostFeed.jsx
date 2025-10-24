import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import PostCard from './PostCard';

const PostFeed = () => {
  const { backendUrl } = useContext(AppContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `${backendUrl}/api/post/all?page=${pageNum}&limit=10`
      );

      if (response.data.success) {
        const newPosts = response.data.posts;
        
        if (append) {
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setTotalPages(response.data.totalPages);
        setHasMore(pageNum < response.data.totalPages);
      } else {
        setError('Failed to load posts');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, [backendUrl]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handlePostDelete = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  const handleRefresh = () => {
    setPage(1);
    fetchPosts(1, false);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
        <p>{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-300 text-lg mb-4">No posts yet</p>
          <p className="text-gray-500">Be the first to create a post!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDelete={handlePostDelete}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-6 text-gray-400">
              You've reached the end! 🎉
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostFeed;
