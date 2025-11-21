import Book from '../models/bookModel.js';
import Review from '../models/reviewModel.js';
import UserList from '../models/userListModel.js';
import userModel from '../models/userModel.js';
import { createNotificationHelper } from './NotificationController.js';

// Browse/Get all books with filters and pagination
export const browseBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    // Genre filter
    if (req.query.genre) {
      filter.genres = req.query.genre;
    }
    
    // Author filter
    if (req.query.author) {
      filter.author = new RegExp(req.query.author, 'i');
    }
    
    // Year filter
    if (req.query.year) {
      filter.publicationYear = parseInt(req.query.year);
    }
    
    // Rating filter (minimum rating)
    if (req.query.minRating) {
      filter.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    // Build sort object
    let sort = {};
    switch (req.query.sortBy) {
      case 'rating':
        sort = { averageRating: -1, totalRatings: -1 };
        break;
      case 'popularity':
        sort = { addedToListsCount: -1, viewCount: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const books = await Book.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-ratings'); // Exclude detailed ratings array

    const total = await Book.countDocuments(filter);

    res.status(200).json({
      success: true,
      books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBooks: total
    });
  } catch (error) {
    console.error('Error browsing books:', error);
    res.status(500).json({ success: false, message: 'Error fetching books' });
  }
};

// Search books by title, author, or keywords
export const searchBooks = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Text search
    const books = await Book.find(
      { 
        $text: { $search: query },
        isActive: true 
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .select('-ratings');

    const total = await Book.countDocuments({ 
      $text: { $search: query },
      isActive: true 
    });

    res.status(200).json({
      success: true,
      books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBooks: total,
      query
    });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ success: false, message: 'Error searching books' });
  }
};

// Get single book details
export const getBookDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Increment view count
    book.viewCount += 1;
    await book.save();

    // Get reviews for this book
    const reviews = await Review.find({ book: id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      book,
      reviews
    });
  } catch (error) {
    console.error('Error getting book details:', error);
    res.status(500).json({ success: false, message: 'Error fetching book details' });
  }
};

// Rate a book
export const rateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.userId;

  if (!userId || !id) {
   return res.status(401).json({
     success: false,
      message: "Please login before rating the book"
   });
 }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if user already rated
    const existingRatingIndex = book.ratings.findIndex(r => r.user.toString() === userId);

    if (existingRatingIndex !== -1) {
      // Update existing rating
      book.ratings[existingRatingIndex].rating = rating;
      book.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      book.ratings.push({
        user: userId,
        rating,
        createdAt: new Date()
      });
    }

    // Update average rating
    book.updateAverageRating();
    await book.save();

    // Notify followers about the new rating (only for new ratings, not updates)
    if (existingRatingIndex === -1) {
      try {
        const user = await userModel.findById(userId).select('followers');
        if (user && user.followers && user.followers.length > 0) {
          const notificationPromises = user.followers.map(followerId =>
            createNotificationHelper(followerId, userId, 'new_rating', { bookId: id })
          );
          await Promise.all(notificationPromises);
        }
      } catch (notifError) {
        console.error('Error creating follower notifications for rating:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: existingRatingIndex !== -1 ? 'Rating updated' : 'Rating added',
      averageRating: book.averageRating,
      totalRatings: book.totalRatings
    });
  } catch (error) {
    console.error('Error rating book:', error);
    res.status(500).json({ success: false, message: 'Error rating book' });
  }
};

// Add/Update review
// export const addReview = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { rating, reviewText, visibility } = req.body;
//     const userId = req.userId;
//     if (!userId || !id) {
//       return res.status(401).json({
//         success: false,
//         message: "Please login before submitting a review"
//       });
//     }
//     const userName = req.userName;

    // Require authentication: ensure middleware populated userId
    // if (!userId) {
    //   return res.status(401).json({ success: false, message: 'Not authorized. Please login to post reviews.' });
    // }
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText, visibility } = req.body;
    const userId = req.userId;
    const userName = req.userName;

   // 🚨 BLOCK any operation if user or book missing
   if (!userId || !id) {
     return res.status(401).json({
       success: false,
       message: "Please login before submitting a review"
     });
   }

    if (!rating || !reviewText || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating and review text are required'
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const authHdr = req.headers.authorization || null;
        console.log(`[addReview] incoming: bookId=${id}, userId=${userId}, userName=${userName}, tokenHeader=${req.headers.token ? 'present' : 'missing'}, authorization=${authHdr ? 'present' : 'missing'}`);
      } catch (e) { /* ignore logging errors */ }
    }
    // normalize visibility
    const vis = visibility === 'followers' ? 'followers' : 'public';

    if (!rating || !reviewText || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating and review text are required' });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if user already reviewed
    let review = await Review.findOne({ book: id, user: userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.reviewText = reviewText;
      review.isEdited = true;
      review.editedAt = new Date();
      await review.save();
    } else {
      // Create new review
      review = new Review({
        book: id,
        user: userId,
        userName,
        rating,
        reviewText,
        visibility: vis
      });
      try {
        await review.save();
        // Update book review count
        book.totalReviews += 1;
      } catch (saveErr) {
        // Handle duplicate key (race condition) by updating existing review instead
        if (saveErr && saveErr.code === 11000) {
          const existing = await Review.findOne({ book: id, user: userId });
          if (existing) {
            existing.rating = rating;
            existing.reviewText = reviewText;
            existing.isEdited = true;
            existing.editedAt = new Date();
            existing.visibility = vis;
            await existing.save();
            review = existing;
          } else {
            throw saveErr;
          }
        } else {
          throw saveErr;
        }
      }
    }

    // Also update the book rating
    const existingRatingIndex = book.ratings.findIndex(r => r.user.toString() === userId);

    if (existingRatingIndex !== -1) {
      book.ratings[existingRatingIndex].rating = rating;
    } else {
      book.ratings.push({
        user: userId,
        rating
      });
    }

    book.updateAverageRating();
    await book.save();

    // Notify followers about the new review (only for new reviews, not updates)
    if (!review.isEdited) {
      try {
        const user = await userModel.findById(userId).select('followers');
        if (user && user.followers && user.followers.length > 0) {
          const notificationPromises = user.followers.map(followerId =>
            createNotificationHelper(followerId, userId, 'new_review', { reviewId: review._id, bookId: id })
          );
          await Promise.all(notificationPromises);
        }
      } catch (notifError) {
        console.error('Error creating follower notifications for review:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: review.isEdited ? 'Review updated' : 'Review added',
      review
    });
  } catch (error) {
    console.error('Error adding review:', error);
      const payload = { success: false, message: error.message || 'Error adding review' };
      if (process.env.NODE_ENV !== 'production') payload.error = error.stack || error;
      res.status(500).json(payload);
  }
};

// Get reviews for a book
export const getBookReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ book: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ book: id });

    res.status(200).json({
      success: true,
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText, visibility } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login to update reviews' });
    }

    if (!rating || !reviewText || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating and review text are required' });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if the user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reviews' });
    }

    const oldRating = review.rating;

    // Update review
    review.rating = rating;
    review.reviewText = reviewText;
    review.visibility = visibility || review.visibility;
    review.isEdited = true;
    review.editedAt = new Date();
    await review.save();

    // Update book rating if rating changed
    if (oldRating !== rating) {
      const book = await Book.findById(review.book);
      if (book) {
        const ratingIndex = book.ratings.findIndex(r => r.user.toString() === userId);
        if (ratingIndex !== -1) {
          book.ratings[ratingIndex].rating = rating;
          book.updateAverageRating();
          await book.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Error updating review' });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login to delete reviews' });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if the user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    const bookId = review.book;

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update book: remove rating and update counts
    const book = await Book.findById(bookId);
    if (book) {
      book.ratings = book.ratings.filter(r => r.user.toString() !== userId);
      book.totalReviews = Math.max(0, book.totalReviews - 1);
      book.updateAverageRating();
      await book.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Error deleting review' });
  }
};

// Add book to user list
export const addToList = async (req, res) => {
  try {
    const { id } = req.params;
    const { listType, customListName, notes } = req.body;
    const userId = req.userId;

    // Check if user has premium access
    const user = await userModel.findById(userId);
    if (!user || !user.hasPremiumAccess()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Premium subscription required to add books to lists',
        requiresPremium: true
      });
    }

    if (!listType) {
      return res.status(400).json({ success: false, message: 'List type is required' });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if already in this list
    const existing = await UserList.findOne({ user: userId, book: id, listType });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Book already in this list' });
    }

    const userList = new UserList({
      user: userId,
      book: id,
      listType,
      customListName,
      notes,
      status: listType === 'currently-reading' ? 'in-progress' : 'not-started'
    });

    await userList.save();

    // Update book stats
    book.addedToListsCount += 1;
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book added to list',
      userList
    });
  } catch (error) {
    console.error('Error adding to list:', error);
    res.status(500).json({ success: false, message: 'Error adding book to list' });
  }
};

// Remove book from list
export const removeFromList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Remove all instances of this book from user's lists
    const result = await UserList.deleteMany({
      user: userId,
      book: id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Book not found in any list' });
    }

    // Update book stats
    const book = await Book.findById(id);
    if (book && book.addedToListsCount > 0) {
      book.addedToListsCount = Math.max(0, book.addedToListsCount - result.deletedCount);
      await book.save();
    }

    res.status(200).json({
      success: true,
      message: 'Book removed from list'
    });
  } catch (error) {
    console.error('Error removing from list:', error);
    res.status(500).json({ success: false, message: 'Error removing book from list' });
  }
};

// Get user's lists
export const getUserLists = async (req, res) => {
  try {
    const userId = req.userId;
    const { listType } = req.query;

    console.log('getUserLists called for userId:', userId, 'listType:', listType);

    const filter = { user: userId };
    if (listType) {
      filter.listType = listType;
    }

    // First check if any lists exist at all
    const allUserLists = await UserList.find(filter);
    console.log('Found userLists (unpopulated):', allUserLists.length);
    console.log('First list sample:', allUserLists[0]);

    const userLists = await UserList.find(filter)
      .populate({
        path: 'book',
        select: 'title author coverImage isbn genres averageRating totalRatings synopsis publicationDate'
      })
      .sort({ createdAt: -1 });

    console.log('Found userLists (populated):', userLists.length);
    console.log('First populated list sample:', userLists[0]);

    res.status(200).json({
      success: true,
      lists: userLists
    });
  } catch (error) {
    console.error('Error getting user lists:', error);
    res.status(500).json({ success: false, message: 'Error fetching user lists', error: error.message });
  }
};

// Update reading status
export const updateReadingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentPage, percentage, listType } = req.body;
    const userId = req.userId;

    // Find the book in user's lists
    let userList = await UserList.findOne({
      user: userId,
      book: id
    });

    if (!userList) {
      return res.status(404).json({ success: false, message: 'Book not found in your lists' });
    }

    // Handle status changes
    if (status === 'reading') {
      // Move to currently-reading list
      userList.listType = 'currently-reading';
      userList.status = 'in-progress';
      if (!userList.dateStarted) {
        userList.dateStarted = new Date();
      }
    } else if (status === 'finished') {
      // Move to read list
      userList.listType = 'read';
      userList.status = 'completed';
      userList.dateFinished = new Date();
    }

    // Update progress
    if (currentPage !== undefined) userList.progress.currentPage = currentPage;
    if (percentage !== undefined) userList.progress.percentage = percentage;
    if (listType) userList.listType = listType;

    await userList.save();

    res.status(200).json({
      success: true,
      message: 'Reading status updated',
      userList
    });
  } catch (error) {
    console.error('Error updating reading status:', error);
    res.status(500).json({ success: false, message: 'Error updating reading status' });
  }
};

// Create a new book (admin/user submitted)
export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      synopsis,
      publisher,
      publicationDate,
      publicationYear,
      genres,
      coverImage,
      pageCount,
      language
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Title and author are required' });
    }

    const book = new Book({
      title,
      author,
      isbn,
      synopsis,
      publisher,
      publicationDate,
      publicationYear,
      genres,
      coverImage,
      pageCount,
      language
    });

    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ success: false, message: 'Error creating book' });
  }
};

// Get reviews by user
export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ user: userId })
      .populate('book', 'title author coverImage averageRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
};

// Get user's lists (public view)
export const getUserListsPublic = async (req, res) => {
  try {
    const { userId } = req.params;

    const lists = await UserList.find({ user: userId })
      .populate('book', 'title author coverImage averageRating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lists
    });
  } catch (error) {
    console.error('Error fetching user lists:', error);
    res.status(500).json({ success: false, message: 'Error fetching lists' });
  }
};

// Get reviews from users you follow (for Posts feed)
export const getFollowingReviews = async (req, res) => {
  try {
    const userId = req.userId; // Get from middleware, not req.body
    
    console.log('getFollowingReviews called for userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please login to view following reviews' });
    }

    // Import user model to get following list
    const userModel = (await import('../models/userModel.js')).default;
    const user = await userModel.findById(userId).select('following');
    
    console.log('User following list:', user?.following);
    
    if (!user || !user.following || user.following.length === 0) {
      console.log('User has no following');
      return res.status(200).json({ success: true, reviews: [] });
    }

    // Get reviews from followed users - include all reviews regardless of visibility
    const reviews = await Review.find({ 
      user: { $in: user.following }
    })
      .populate('user', 'username email')
      .populate('book', 'title author coverImage averageRating')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('Found reviews from following:', reviews.length);
    console.log('Reviews:', reviews.map(r => ({ 
      user: r.user?.username, 
      book: r.book?.title,
      rating: r.rating,
      text: r.reviewText?.substring(0, 20)
    })));

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching following reviews:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
};
