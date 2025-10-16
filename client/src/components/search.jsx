import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { assets } from '../assests/assets';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { backendUrl, user, token, fetchUser } = useContext(AppContext); // assuming token is stored in context

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/search/${query}`);
      if (data.success) {
        // Map isFollowing for each result
        const mappedResults = data.users.map(u => ({
          ...u,
          isFollowing: user.following?.includes(u._id) // assuming user.following exists
        }));
        setResults(mappedResults);
      }
    } catch (error) {
      console.log(error);
    }
  };

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
    setResults(prev =>
      prev.map(u => u._id === userIdToToggle ? { ...u, isFollowing: !isFollowing } : u)
    );

  } catch (error) {
    console.log(error);
  }
};


  return (
    <div className="flex flex-col items-center mt-10 text-white">
      <h1 className="text-2xl mb-4">Search Users</h1>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        {results.length > 0 && (
          <ul className="bg-gray-900 rounded p-4 space-y-2">
            {results.map((userItem) => (
              <li
                key={userItem._id}
                className="flex justify-between items-center p-3"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={assets.profile_icon}
                    alt={`${userItem.name}'s profile`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-lg text-white">{userItem.name}</p>
                    <p className="text-sm text-gray-400">@{userItem.username}</p>
                  </div>
                </div>

                {/* Follow / Unfollow Button */}
                <button
                  onClick={() => handleFollowToggle(userItem._id, userItem.isFollowing)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                    userItem.isFollowing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  aria-label={`${userItem.isFollowing ? 'Unfollow' : 'Follow'} ${userItem.name}`}
                >
                  {userItem.isFollowing ? '✓' : '+'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {results.length === 0 && query && (
           <p className="text-gray-400 mt-4 text-center">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default Search;
