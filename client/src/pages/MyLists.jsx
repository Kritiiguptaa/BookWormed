import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const MyLists = () => {
  const { backendUrl, token, setShowLogin, subscription } = useContext(AppContext);
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    
    // Wait for subscription to load before checking premium access
    if (subscription === null) {
      console.log('Waiting for subscription data to load...');
      setLoading(true); // Show loading while waiting for subscription
      return;
    }
    
    // Check for premium access
    if (!subscription.hasPremium) {
      console.log('No premium access, redirecting to subscription page');
      navigate('/subscription');
      return;
    }
    
    console.log('User has premium access, fetching lists...');
    fetchLists();
  }, [token, subscription]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const url = `${backendUrl}/api/book/lists`;
      console.log('Fetching lists from:', url);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Backend URL from env:', backendUrl);
      
      const response = await axios.get(url, {
        headers: { token }
      });

      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        console.log('Lists received:', response.data.lists.length);
        console.log('Lists array:', response.data.lists);
        
        // Supplement cover images from books_full.json if missing
        let listsWithCovers = response.data.lists;
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
          
          // Supplement missing cover images
          listsWithCovers = response.data.lists.map(item => {
            if (item.book && !item.book.coverImage) {
              const bookKey = `${item.book.title?.toLowerCase()?.trim()}___${item.book.author?.toLowerCase()?.trim()}`;
              const coverUrl = imageMap.get(bookKey);
              if (coverUrl) {
                return {
                  ...item,
                  book: {
                    ...item.book,
                    coverImage: coverUrl
                  }
                };
              }
            }
            return item;
          });
        } catch (error) {
          console.error('Error supplementing cover images:', error);
        }
        
        setLists(listsWithCovers);
      } else {
        console.error('Response was not successful:', response.data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (bookId) => {
    if (!window.confirm('Remove this book from your list?')) return;

    try {
      const response = await axios.delete(
        `${backendUrl}/api/book/${bookId}/list`,
        { headers: { token } }
      );

      if (response.data.success) {
        fetchLists();
      }
    } catch (error) {
      console.error('Error removing book:', error);
      alert('Failed to remove book from list');
    }
  };

  const handleUpdateStatus = async (bookId, status) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/book/${bookId}/status`,
        { status },
        { headers: { token } }
      );

      if (response.data.success) {
        fetchLists();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update reading status');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredLists = activeTab === 'all' 
    ? lists 
    : lists.filter(item => item.listType === activeTab);

  const tabs = [
    { id: 'all', label: 'All Books', count: lists.length },
    { id: 'want-to-read', label: 'Want to Read', count: lists.filter(l => l.listType === 'want-to-read').length },
    { id: 'currently-reading', label: 'Currently Reading', count: lists.filter(l => l.listType === 'currently-reading').length },
    { id: 'read', label: 'Read', count: lists.filter(l => l.listType === 'read').length },
    { id: 'favorites', label: 'Favorites', count: lists.filter(l => l.listType === 'favorites').length },
  ];

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Please log in to view your lists</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-6">My Book Lists</h1>

        {/* Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Books List */}
        {filteredLists.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No books in this list yet</p>
            <Link
              to="/books"
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLists.map((item) => {
              // Skip if book is not populated
              if (!item.book || !item.book._id) {
                console.warn('Skipping item with missing book data:', item);
                return null;
              }
              
              return (
              <div
                key={item._id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <Link to={`/books/${item.book._id}`} className="flex-shrink-0">
                    {item.book.coverImage ? (
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className="w-24 h-36 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentElement.innerHTML = '<div class="w-24 h-36 bg-gradient-to-br from-gray-700 to-gray-600 rounded flex items-center justify-center"><span class="text-4xl">📚</span></div>';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-36 bg-gradient-to-br from-gray-700 to-gray-600 rounded flex items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                  </Link>

                  {/* Book Info */}
                  <div className="flex-1">
                    <Link
                      to={`/books/${item.book._id}`}
                      className="text-xl font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {item.book.title}
                    </Link>
                    <p className="text-gray-400 mb-2">by {item.book.author || 'Unknown'}</p>

                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(item.book.averageRating || 0)}
                      <span className="text-sm text-gray-400">
                        {(item.book.averageRating || 0).toFixed(1)} ({item.book.totalRatings || 0} ratings)
                      </span>
                    </div>

                    {/* List Type Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full">
                        {item.listType.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                      {item.status && (
                        <span className="bg-green-900 text-green-300 text-xs px-3 py-1 rounded-full">
                          {item.status.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      )}
                    </div>

                    {/* Reading Progress */}
                    {item.status === 'reading' && item.currentPage && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>
                            {item.currentPage} / {item.book.pageCount || '?'} pages
                            {item.readingProgress > 0 && ` (${Math.round(item.readingProgress)}%)`}
                          </span>
                        </div>
                        {item.readingProgress > 0 && (
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${item.readingProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-500 mb-3">
                      {item.dateStarted && (
                        <span className="mr-4">
                          Started: {new Date(item.dateStarted).toLocaleDateString()}
                        </span>
                      )}
                      {item.dateFinished && (
                        <span>
                          Finished: {new Date(item.dateFinished).toLocaleDateString()}
                        </span>
                      )}
                      {!item.dateStarted && !item.dateFinished && item.createdAt && (
                        <span>
                          Added: {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.listType === 'want-to-read' && (
                        <button
                          onClick={() => handleUpdateStatus(item.book._id, 'reading')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Start Reading
                        </button>
                      )}
                      {item.listType === 'currently-reading' && (
                        <button
                          onClick={() => handleUpdateStatus(item.book._id, 'finished')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Mark as Finished
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFromList(item.book._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLists;
