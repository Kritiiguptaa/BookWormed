import Post from '../models/postModel.js';
import Review from '../models/reviewModel.js';
import Book from '../models/bookModel.js';

export const getStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        posts: totalPosts,
        reviews: totalReviews,
        books: totalBooks
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};