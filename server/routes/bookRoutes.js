import express from 'express';
import {
  browseBooks,
  searchBooks,
  getBookDetails,
  rateBook,
  addReview,
  getBookReviews,
  addToList,
  removeFromList,
  getUserLists,
  updateReadingStatus,
  createBook,
  getReviewsByUser,
  getUserListsPublic,
  getFollowingReviews
} from '../controllers/BookController.js';
import authUser from '../middlewares/authPost.js';

const bookRouter = express.Router();

// Public routes
bookRouter.get('/browse', browseBooks); // Browse books with filters
bookRouter.get('/search', searchBooks); // Search books
bookRouter.get('/reviews/user/:userId', getReviewsByUser); // Get user's reviews (public)
bookRouter.get('/lists/user/:userId', getUserListsPublic); // Get user's lists (public)

// Protected routes (require authentication) - specific routes before parameterized routes
bookRouter.get('/lists', authUser, getUserLists); // Get user's all lists
bookRouter.get('/reviews/following', authUser, getFollowingReviews); // Get reviews from following
bookRouter.post('/create', authUser, createBook); // Create new book

// Book-specific routes
bookRouter.get('/:id', getBookDetails); // Get book details
bookRouter.get('/:id/reviews', getBookReviews); // Get book reviews
bookRouter.post('/:id/rate', authUser, rateBook); // Rate a book
bookRouter.post('/:id/review', authUser, addReview); // Add/update review
bookRouter.post('/:id/list', authUser, addToList); // Add book to list
bookRouter.delete('/:id/list', authUser, removeFromList); // Remove from list
bookRouter.put('/:id/status', authUser, updateReadingStatus); // Update reading progress

export default bookRouter;
