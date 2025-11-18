import Notification from '../models/notificationModel.js';

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { recipientId, senderId, type, postId, reviewId, bookId, comment } = req.body;

    // Don't create notification if sender is the recipient
    if (recipientId === senderId) {
      return res.status(200).json({ success: true, message: 'No self-notification' });
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      review: reviewId,
      book: bookId,
      comment
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Error creating notification' });
  }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username email profilePicture')
      .populate('post', 'title')
      .populate('book', 'title coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUnread = await Notification.countDocuments({ recipient: userId, read: false });
    const total = await Notification.countDocuments({ recipient: userId });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount: totalUnread,
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Error updating notifications' });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Notification.countDocuments({ recipient: userId, read: false });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Error fetching unread count' });
  }
};

// Helper function to create notification (can be used in other controllers)
export const createNotificationHelper = async (recipientId, senderId, type, data = {}) => {
  try {
    // Don't create notification if sender is the recipient
    if (recipientId === senderId || !recipientId || !senderId) {
      return;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      post: data.postId,
      review: data.reviewId,
      book: data.bookId,
      comment: data.comment
    });

    await notification.save();
  } catch (error) {
    console.error('Error creating notification helper:', error);
  }
};
