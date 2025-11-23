import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const Notifications = () => {
  const { backendUrl, token, fetchNotificationCount } = useContext(AppContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/notification`, {
        headers: { token }
      });
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${backendUrl}/api/notification/${notificationId}/read`,
        {},
        { headers: { token } }
      );
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update bell icon count
      if (fetchNotificationCount) {
        fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/notification/mark-all-read`,
        {},
        { headers: { token } }
      );
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
      
      // Update bell icon count
      if (fetchNotificationCount) {
        fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${backendUrl}/api/notification/${notificationId}`, {
        headers: { token }
      });
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        if (notification.sender?._id) {
          navigate(`/profile/${notification.sender._id}`);
        }
        break;
      case 'like_post':
      case 'comment_post':
      case 'new_post':
        if (notification.post?._id) {
          navigate(`/posts`); // Navigate to posts page - you might want to add a specific post view
        }
        break;
      case 'like_review':
      case 'new_review':
      case 'new_rating':
        if (notification.book?._id) {
          navigate(`/books/${notification.book._id}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationMessage = (notification) => {
    const senderName = notification.sender?.name || 'Someone';
    
    switch (notification.type) {
      case 'follow':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> started following you</span>
          </>
        );
      case 'like_post':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> liked your post</span>
            {notification.post?.title && (
              <span className="text-gray-400"> "{notification.post.title}"</span>
            )}
          </>
        );
      case 'comment_post':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> commented on your post</span>
            {notification.comment && (
              <p className="text-gray-400 text-sm mt-1 italic">"{notification.comment.substring(0, 50)}..."</p>
            )}
          </>
        );
      case 'like_review':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> liked your review</span>
            {notification.book?.title && (
              <span className="text-gray-400"> for "{notification.book.title}"</span>
            )}
          </>
        );
      case 'new_review':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> reviewed</span>
            {notification.book?.title && (
              <Link to={`/books/${notification.book._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
                {' "' + notification.book.title + '"'}
              </Link>
            )}
          </>
        );
      case 'new_post':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> created a new post</span>
            {notification.post?.title && (
              <span className="text-gray-400"> "{notification.post.title}"</span>
            )}
          </>
        );
      case 'new_rating':
        return (
          <>
            <Link to={`/profile/${notification.sender._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
              {senderName}
            </Link>
            <span className="text-gray-300"> rated</span>
            {notification.book?.title && (
              <Link to={`/books/${notification.book._id}`} className="font-semibold text-blue-400 hover:text-blue-300">
                {' "' + notification.book.title + '"'}
              </Link>
            )}
          </>
        );
      default:
        return <span className="text-gray-300">New notification</span>;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like_post':
        return '❤️';
      case 'comment_post':
        return '💬';
      case 'like_review':
        return '⭐';
      case 'new_review':
        return '📝';
      case 'new_post':
        return '📄';
      case 'new_rating':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Please login to view notifications</p>
          <Link to="/" className="text-blue-500 hover:text-blue-400">Go to Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-400 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-400 text-lg mb-2">No notifications yet</p>
            <p className="text-gray-500 text-sm">When someone interacts with your content, you'll see it here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {getNotificationMessage(notification)}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
