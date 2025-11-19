import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assests/assets';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('users'); // 'users' or 'books'
  const [userResults, setUserResults] = useState([]);
  const [bookResults, setBookResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { backendUrl, user, token, fetchUser } = useContext(AppContext);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      setBookResults([]);
      return;
    }
    setIsSearching(true);
    setIsSearching(true);
    try {
      if (searchType === 'users') {
        const { data } = await axios.get(`${backendUrl}/api/user/search/${searchQuery}`);
        if (data.success) {
          // Filter out the current user from results
          const filteredUsers = data.users.filter(u => user?._id && u._id !== user._id);
          
          const mappedResults = filteredUsers.map(u => ({
            ...u,
            isFollowing: user?.following?.includes(u._id)
          }));
          setUserResults(mappedResults);
          setBookResults([]);
        }
      } else {
        const { data } = await axios.get(`${backendUrl}/api/book/search?query=${searchQuery}`);
        if (data.success) {
          setBookResults(data.books);
          setUserResults([]);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect - searches automatically as user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(query);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounce);
  }, [query, searchType]); // Re-run when query or searchType changes

  const handleFollowToggle = async (userIdToToggle, isFollowing) => {
  try {
    if (!token) return alert("Login first");

    if (isFollowing) {
      // Call backend to unfollow
      await axios.post(`${backendUrl}/api/user/unfollow/${userIdToToggle}`, {userId: user._id}, {
        headers: { token }
      });
    } else {
      // Call backend to follow
      await axios.post(`${backendUrl}/api/user/follow/${userIdToToggle}`, { userId: user._id }, {
        headers: { token }
      });
    }
    await fetchUser();
    // Update local state so UI reflects change
    setUserResults(prev =>
      prev.map(u => u._id === userIdToToggle ? { ...u, isFollowing: !isFollowing } : u)
    );

  } catch (error) {
    console.log(error);
  }
};


  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Search</h1>
        
        {/* Search Type Toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setSearchType('users')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              searchType === 'users'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            👤 Search Users
          </button>
          <button
            onClick={() => setSearchType('books')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              searchType === 'books'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📚 Search Books
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'users' ? 'Search users by name or username...' : 'Search by title, author, or ISBN...'}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <div className="flex items-center px-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* User Results */}
        {searchType === 'users' && userResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Users ({userResults.length})</h2>
            <div className="space-y-3">
              {userResults.map((userItem) => (
                <div
                  key={userItem._id}
                  className="flex justify-between items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Link
                    to={`/profile/${userItem._id}`}
                    className="flex items-center gap-4 flex-1"
                  >
                    <img
                      src={userItem.profilePicture || assets.profile_icon}
                      alt={`${userItem.name}'s profile`}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-600"
                    />
                    <div>
                      <p className="font-bold text-lg text-white hover:text-blue-400">
                        {userItem.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        @{userItem.username || userItem.email?.split('@')[0]}
                      </p>
                      {userItem.bio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{userItem.bio}</p>
                      )}
                    </div>
                  </Link>

                  {/* Follow / Unfollow Button */}
                  {user && token && user._id !== userItem._id && (
                    <button
                      onClick={() => handleFollowToggle(userItem._id, userItem.isFollowing)}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        userItem.isFollowing
                          ? 'bg-gray-600 text-white hover:bg-gray-500'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {userItem.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {!user && token && (
                    <span className="text-gray-500 text-sm">Loading...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book Results */}
        {searchType === 'books' && bookResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Books ({bookResults.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookResults.map((book) => (
                <Link
                  key={book._id}
                  to={`/books/${book._id}`}
                  className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden hover:border-blue-500 transition-all"
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = '<div class="w-16 h-24 bg-gradient-to-br from-gray-700 to-gray-600 rounded flex items-center justify-center"><span class="text-2xl">📚</span></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-600 flex items-center justify-center">
                      <span className="text-6xl">📚</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{book.author}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= Math.round(book.averageRating) ? 'text-yellow-400' : 'text-gray-600'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        ({book.totalRatings})
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {((searchType === 'users' && userResults.length === 0 && query) ||
          (searchType === 'books' && bookResults.length === 0 && query)) && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">No results found for "{query}"</p>
            <p className="text-gray-500 text-sm mt-2">Try different search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
