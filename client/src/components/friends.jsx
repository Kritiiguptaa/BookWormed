// import React, { useState, useEffect, useContext } from 'react';
// import axios from 'axios';
// import { AppContext } from '../context/AppContext';
// import { assets } from '../assests/assets';

// const Friends = () => {
//   const { backendUrl, user, token, fetchUser } = useContext(AppContext);
//   const [friends, setFriends] = useState([]);

//   // Fetch friends list
//   const fetchFriends = async () => {
//     if (!token) return;
//     try {
//       const { data } = await axios.get(`${backendUrl}/api/user/friends/${user._id}`, {
//         headers: { token },
//       });
//       if (data.success) {
//         setFriends(data.friends); // array of user objects
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     fetchFriends();
//   }, [user]);

//   const handleFollowToggle = async (userIdToToggle, isFollowing) => {
//     try {
//       if (!token) return alert("Login first");

//       if (isFollowing) {
//         // Unfollow
//         await axios.post(`${backendUrl}/api/user/unfollow/${userIdToToggle}`, {userId: user._id}, { headers: { token } });
//         await fetchUser();
//       } else {
//         // Follow
//         await axios.post(`${backendUrl}/api/user/follow/${userIdToToggle}`, { userId: user._id }, { headers: { token } });
//         await fetchUser();
//       }

//       // Update local friends state
//       setFriends(prev =>
//         prev.map(u => u._id === userIdToToggle ? { ...u, isFollowing: !isFollowing } : u)
//       );

//       // If unfollowed, remove from friends list
//       if (isFollowing) {
//         setFriends(prev => prev.filter(u => u._id !== userIdToToggle));
//       }

//     } catch (error) {
//       console.log(error);
//     }
//   };


// const handleUnfollow = async (userIdToUnfollow) => {
//   try {
//     if (!token) return alert("Login first");

//     // 1. Call the backend to unfollow the user
//     await axios.post(`${backendUrl}/api/user/unfollow/${userIdToUnfollow}`, { userId: user._id }, { 
//       headers: { token } 
//     });

//     // 2. Refresh the global user data for consistency across the app
//     await fetchUser();

//     // 3. Remove the friend from the local state for an immediate UI update
//     setFriends(prevFriends => 
//       prevFriends.filter(friend => friend._id !== userIdToUnfollow)
//     );

//   } catch (error) {
//     console.log(error);
//   }
// };

//   return (
//     <div className="flex flex-col items-center mt-10 text-white">
//       <h1 className="text-2xl mb-4">My Friends</h1>

//       <div className="mt-6 w-full max-w-2xl">
//         {friends.length > 0 ? (
//           <ul className="bg-gray-900 rounded p-4 space-y-2">
//             {friends.map(friend => (
//               <li key={friend._id} className="flex justify-between items-center p-3">
//                 <div className="flex items-center gap-4">
//                   <img
//                     src={assets.profile_icon}
//                     alt={`${friend.name}'s profile`}
//                     className="w-12 h-12 rounded-full object-cover"
//                   />
//                   <div>
//                     <p className="font-bold text-lg text-white">{friend.name}</p>
//                     <p className="text-sm text-gray-400">@{friend.username}</p>
//                   </div>
//                 </div>

//               <button
//                 onClick={() => handleUnfollow(friend._id)} // 1. Call the correct function
//                 className="w-10 h-10 flex items-center justify-center rounded-full transition bg-green-600 hover:bg-red-600" // 2. Simplified and improved styling
//                 aria-label={`Unfollow ${friend.name}`} // 3. Simplified label
//               >
//                 ✓{/* 4. Always show the checkmark */}
//               </button>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-400 mt-4 text-center">You have no friends yet. Search and follow users!</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Friends;












import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { assets } from '../assests/assets';

const Friends = () => {
  const { backendUrl, user, token, fetchUser } = useContext(AppContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch friends list
  const fetchFriends = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('Fetching friends from:', `${backendUrl}/api/user/friends`);
      
      const { data } = await axios.get(`${backendUrl}/api/user/friends`, {
        headers: { token },
      });
      
      console.log('Friends response:', data);
      
      if (data.success) {
        setFriends(data.friends || []);
      } else {
        setError(data.message || 'Failed to load friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriends();
    } else {
      setLoading(false);
    }
  }, [token]); // This will re-run when the user object is updated via fetchUser

  const handleUnfollow = async (userIdToUnfollow, userName) => {
    const confirmUnfollow = window.confirm(`Are you sure you want to unfollow ${userName}?`);
    if (!confirmUnfollow) return;

    try {
      if (!token) return alert("Please login first");

      await axios.post(`${backendUrl}/api/user/unfollow/${userIdToUnfollow}`, {}, {
        headers: { token }
      });

      // Refresh user data if fetchUser is available
      if (fetchUser) {
        await fetchUser();
      }

      // Remove the friend from the local state for immediate UI update
      setFriends(prevFriends =>
        prevFriends.filter(friend => friend._id !== userIdToUnfollow)
      );

    } catch (error) {
      console.error('Error unfollowing:', error);
      alert(error.response?.data?.message || 'Failed to unfollow user');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Please log in to view your following list</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading following list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchFriends}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Following</h1>
          <p className="text-gray-400 text-sm">
            {friends.length > 0 
              ? `${friends.length} ${friends.length === 1 ? 'person' : 'people'}`
              : 'No one yet'}
          </p>
        </div>

        {/* Friends List */}
        {friends.length > 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700">
            {friends.map(friend => (
              <div 
                key={friend._id} 
                className="px-4 py-3 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Profile Picture + Info */}
                  <Link 
                    to={`/profile/${friend._id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <img
                      src={friend.profilePicture || assets.profile_icon}
                      alt={`${friend.name}'s profile`}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white hover:text-gray-300 transition-colors truncate">
                        @{friend.username || friend.email.split('@')[0]}
                      </p>
                      {friend.bio && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Right: Unfollow Button */}
                  <button
                    onClick={() => handleUnfollow(friend._id, friend.username || friend.email.split('@')[0])}
                    className="ml-4 px-6 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-colors flex-shrink-0"
                  >
                    Following
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-16 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Following Yet</h2>
            <p className="text-gray-400 mb-6 text-sm">
              When you follow people, you'll see them here
            </p>
            <Link
              to="/search"
              className="inline-block px-6 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Find People
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
