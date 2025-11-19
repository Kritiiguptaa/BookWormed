import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const BookDetails = () => {
  const { id } = useParams();
  const { backendUrl, token, user, setShowLogin } = useContext(AppContext);
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewVisibility, setReviewVisibility] = useState('public');
  const [selectedList, setSelectedList] = useState('');
  const [currentListType, setCurrentListType] = useState(null);
  const [isInList, setIsInList] = useState(false);

  useEffect(() => {
    fetchBookDetails();
    if (token) {
      checkBookInList();
    }
  }, [id, token]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching book details for ID:', id);
      const response = await axios.get(`${backendUrl}/api/book/${id}`, { headers: { token } });
      
      console.log('Book details response:', response.data);
      
      if (response.data.success) {
        let bookData = response.data.book;
        
        // Supplement cover image from books_full.json if missing
        if (!bookData.coverImage) {
          try {
            const booksResponse = await fetch('/books_full.json');
            const allBooks = await booksResponse.json();
            
            // Create a map for quick lookup
            const imageMap = new Map();
            allBooks.forEach(b => {
              const key = `${String(b.Book || '').toLowerCase().trim()}___${String(b.Author || '').toLowerCase().trim()}`;
              if (b.Image_URL) {
                imageMap.set(key, b.Image_URL);
              }
            });
            
            // Try to find matching cover
            const bookKey = `${bookData.title?.toLowerCase()?.trim()}___${bookData.author?.toLowerCase()?.trim()}`;
            const coverUrl = imageMap.get(bookKey);
            if (coverUrl) {
              bookData.coverImage = coverUrl;
            }
          } catch (error) {
            console.error('Error supplementing cover image:', error);
          }
        }
        
        setBook(bookData);
        setReviews(response.data.reviews);
        
        // Check if user already rated
        if (user && response.data.book.ratings) {
          const userRatingObj = response.data.book.ratings.find(
            r => r.user === user._id
          );
          if (userRatingObj) {
            setUserRating(userRatingObj.rating);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookInList = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/book/lists`, {
        headers: { token }
      });
      
      if (response.data.success) {
        const bookInList = response.data.lists.find(
          item => item.book?._id === id || item.book === id
        );
        
        if (bookInList) {
          setIsInList(true);
          setCurrentListType(bookInList.listType);
          setSelectedList(bookInList.listType);
        }
      }
    } catch (error) {
      console.error('Error checking book in list:', error);
    }
  };

  const handleRating = async (rating) => {
    if (!token) {
      setShowLogin(true);
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/book/${id}/rate`,
        { rating },
        { headers: { token } }
      );

      if (response.data.success) {
        setUserRating(rating);
        setBook(prev => ({
          ...prev,
          averageRating: response.data.averageRating,
          totalRatings: response.data.totalRatings
        }));
      }
    } catch (error) {
      console.error('Error rating book:', error);
      alert(error.response?.data?.message || 'Failed to rate book');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setShowLogin(true);
      return;
    }

    if (!reviewRating || !reviewText.trim()) {
      alert('Please provide both rating and review text');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/book/${id}/review`,
        {
          rating: reviewRating,
          reviewText: reviewText.trim(),
          visibility: reviewVisibility
        },
        { headers: { token, Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReviews([response.data.review, ...reviews]);
        setReviewText('');
        setReviewRating(0);
        setShowReviewForm(false);
        fetchBookDetails(); // Refresh to get updated ratings
      }
    } catch (error) {
      console.error('Error submitting review:', error, error.response?.data);
      const serverMsg = error.response?.data?.message || error.response?.data || error.message;
      alert(serverMsg || 'Failed to submit review');
    }
  };

  const handleAddToList = async () => {
    if (!token) {
      setShowLogin(true);
      return;
    }

    if (!selectedList) {
      alert('Please select a list');
      return;
    }

    try {
      if (isInList && currentListType !== selectedList) {
        // Remove from current list first
        await axios.delete(
          `${backendUrl}/api/book/${id}/list`,
          { headers: { token } }
        );
      }

      // Add to new list
      const response = await axios.post(
        `${backendUrl}/api/book/${id}/list`,
        { listType: selectedList },
        { headers: { token } }
      );

      if (response.data.success) {
        setIsInList(true);
        setCurrentListType(selectedList);
        alert(`Book ${isInList && currentListType !== selectedList ? 'moved to' : 'added to'} ${selectedList.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} successfully!`);
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      alert(error.response?.data?.message || 'Failed to add book to list');
    }
  };

  const handleRemoveFromList = async () => {
    if (!token) return;

    try {
      const response = await axios.delete(
        `${backendUrl}/api/book/${id}/list`,
        { headers: { token } }
      );

      if (response.data.success) {
        setIsInList(false);
        setCurrentListType(null);
        setSelectedList('');
        alert('Book removed from list successfully!');
      }
    } catch (error) {
      console.error('Error removing from list:', error);
      alert(error.response?.data?.message || 'Failed to remove book from list');
    }
  };

  const renderStars = (rating, interactive = false, onHover = null, onClick = null) => {
    const stars = [];
    const displayRating = interactive ? (hoverRating || rating) : rating;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-2xl ${
            i <= displayRating ? 'text-yellow-400' : 'text-gray-600'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onMouseEnter={() => interactive && onHover && onHover(i)}
          onMouseLeave={() => interactive && onHover && onHover(0)}
          onClick={() => interactive && onClick && onClick(i)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-gray-400 text-lg">Book not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-900 text-yellow-200 p-2 mb-4 text-xs rounded">
            Debug: Token={token ? 'Yes' : 'No'}, BookID={id}, IsInList={isInList ? 'Yes' : 'No'}
          </div>
        )}
        
        {/* Book Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Book Cover */}
            <div>
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-full aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center"><span class="text-6xl">📚</span></div>';
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">📚</span>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>
              <p className="text-xl text-gray-300 mb-4">by {book.author}</p>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(book.averageRating)}
                  <span className="text-gray-300">
                    {book.averageRating.toFixed(1)} ({book.totalRatings} ratings)
                  </span>
                </div>
              </div>

              {/* Your Rating */}
              {token && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Your Rating:</p>
                  <div className="flex items-center gap-2">
                    {renderStars(userRating, true, setHoverRating, handleRating)}
                    {userRating > 0 && (
                      <span className="text-sm text-gray-400">You rated: {userRating}/5</span>
                    )}
                  </div>
                </div>
              )}

              {/* Book Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                {book.publisher && (
                  <div>
                    <span className="text-gray-400">Publisher:</span>
                    <span className="text-white ml-2">{book.publisher}</span>
                  </div>
                )}
                {book.publicationYear && (
                  <div>
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white ml-2">{book.publicationYear}</span>
                  </div>
                )}
                {book.pageCount && (
                  <div>
                    <span className="text-gray-400">Pages:</span>
                    <span className="text-white ml-2">{book.pageCount}</span>
                  </div>
                )}
                {book.language && (
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <span className="text-white ml-2">{book.language}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="col-span-2">
                    <span className="text-gray-400">ISBN:</span>
                    <span className="text-white ml-2">{book.isbn}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {book.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to List */}
              <div className="mt-4 bg-gray-750 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Add to Your Reading List</h3>
                {token ? (
                  <div>
                    {isInList && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm text-green-400">
                          ✓ In your list: {currentListType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <select
                        value={selectedList}
                        onChange={(e) => setSelectedList(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{isInList ? 'Change list...' : 'Add to list...'}</option>
                        <option value="want-to-read">📚 Want to Read</option>
                        <option value="currently-reading">📖 Currently Reading</option>
                        <option value="read">✅ Read</option>
                        <option value="favorites">⭐ Favorites</option>
                      </select>
                      <button
                        onClick={handleAddToList}
                        disabled={!selectedList || (isInList && selectedList === currentListType)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {isInList && selectedList !== currentListType ? 'Move' : isInList ? 'Update' : 'Add'}
                      </button>
                      {isInList && (
                        <button
                          onClick={handleRemoveFromList}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                          title="Remove from list"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-center">
                    <p className="text-gray-300 mb-3">Sign in to add this book to your reading list</p>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        {book.synopsis && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-3">Synopsis</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{book.synopsis}</p>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Reviews ({book.totalReviews})
            </h2>
            {token && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Your Rating</label>
                <div className="flex items-center gap-2">
                  {renderStars(reviewRating, true, setHoverRating, setReviewRating)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                  maxLength={3000}
                  placeholder="Share your thoughts about this book..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewText('');
                    setReviewRating(0);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No reviews yet. Be the first to review this book!
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/profile/${review.user}`}
                      className="flex items-center gap-2 hover:opacity-80 transition"
                    >
                      <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                        @
                      </div>
                      <span className="font-semibold text-white">@{review.userName || 'unknown'}</span>
                    </Link>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()} {review.isEdited && '(edited)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{review.reviewText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
