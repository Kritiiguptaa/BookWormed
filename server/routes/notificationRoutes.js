import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/NotificationController.js';
import authUser from '../middlewares/authPost.js';

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.get('/', authUser, getUserNotifications); // Get all notifications
notificationRouter.get('/unread-count', authUser, getUnreadCount); // Get unread count
notificationRouter.put('/:notificationId/read', authUser, markAsRead); // Mark as read
notificationRouter.put('/mark-all-read', authUser, markAllAsRead); // Mark all as read
notificationRouter.delete('/:notificationId', authUser, deleteNotification); // Delete notification

export default notificationRouter;
