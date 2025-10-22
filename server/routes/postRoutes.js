import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getUserPosts
} from '../controllers/PostController.js';
import authUser from '../middlewares/authPost.js';

const postRouter = express.Router();

// Public routes
postRouter.get('/all', getAllPosts); // Get all posts with pagination
postRouter.get('/:id', getPostById); // Get single post by ID
postRouter.get('/user/:userId', getUserPosts); // Get posts by specific user

// Protected routes (require authentication)
postRouter.post('/create', authUser, createPost); // Create new post
postRouter.put('/:id', authUser, updatePost); // Update post
postRouter.delete('/:id', authUser, deletePost); // Delete post
postRouter.post('/:id/like', authUser, toggleLike); // Like/Unlike post
postRouter.post('/:id/comment', authUser, addComment); // Add comment
postRouter.delete('/:id/comment/:commentId', authUser, deleteComment); // Delete comment

export default postRouter;
