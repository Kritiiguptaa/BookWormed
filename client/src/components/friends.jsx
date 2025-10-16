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
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { assets } from '../assests/assets';

const Friends = () => {
  const { backendUrl, user, token, fetchUser } = useContext(AppContext);
  const [friends, setFriends] = useState([]);

  // Fetch friends list
  const fetchFriends = async () => {
    // Check if user object is loaded before trying to access its properties
    if (!token || !user?._id) return;
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/friends`, {
        headers: { token },
      });
      if (data.success) {
        setFriends(data.friends); // array of user objects
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]); // This will re-run when the user object is updated via fetchUser

  const handleUnfollow = async (userIdToUnfollow) => {
    try {
      if (!token || !user?._id) return alert("Login first");

      // 1. Call the backend to unfollow the user
      await axios.post(`${backendUrl}/api/user/unfollow/${userIdToUnfollow}`, { userId: user._id }, {
        headers: { token }
      });

      // 2. Refresh the global user data for consistency across the app
      await fetchUser();

      // 3. Remove the friend from the local state for an immediate UI update
      // This is still useful for instant feedback, though the useEffect will also handle it.
      setFriends(prevFriends =>
        prevFriends.filter(friend => friend._id !== userIdToUnfollow)
      );

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 text-white">
      <h1 className="text-2xl mb-4">Following</h1>

      <div className="mt-6 w-full max-w-2xl">
        {friends.length > 0 ? (
          <ul className="bg-gray-900 rounded p-4 space-y-2">
            {friends.map(friend => (
              <li key={friend._id} className="flex justify-between items-center p-3">
                <div className="flex items-center gap-4">
                  <img
                    src={assets.profile_icon}
                    alt={`${friend.name}'s profile`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-lg text-white">{friend.name}</p>
                    <p className="text-sm text-gray-400">@{friend.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnfollow(friend._id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full transition bg-green-600 hover:bg-red-600"
                  aria-label={`Unfollow ${friend.name}`}
                >
                  ✓
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 mt-4 text-center">You are not following anyone yet. Search and follow users!</p>
        )}
      </div>
    </div>
  );
};

export default Friends;
