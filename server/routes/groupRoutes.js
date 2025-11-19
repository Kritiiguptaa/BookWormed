import express from 'express';
import {
  createGroup,
  getAllGroups,
  getUserGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  createGroupPost,
  likeGroupPost,
  commentOnGroupPost,
  deleteGroup
} from '../controllers/groupController.js';
import userAuth from '../middlewares/auth.js';

const groupRouter = express.Router();

// Group CRUD
groupRouter.post('/create', userAuth, createGroup);
groupRouter.get('/all', userAuth, getAllGroups);
groupRouter.get('/user', userAuth, getUserGroups);
groupRouter.get('/:id', userAuth, getGroupById);
groupRouter.delete('/:id', userAuth, deleteGroup);

// Group membership
groupRouter.post('/:id/join', userAuth, joinGroup);
groupRouter.post('/:id/leave', userAuth, leaveGroup);

// Group posts
groupRouter.post('/:id/post', userAuth, createGroupPost);
groupRouter.post('/:groupId/post/:postId/like', userAuth, likeGroupPost);
groupRouter.post('/:groupId/post/:postId/comment', userAuth, commentOnGroupPost);

export default groupRouter;
