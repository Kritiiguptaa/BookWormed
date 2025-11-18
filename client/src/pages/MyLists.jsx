import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const MyLists = () => {
  const { backendUrl, token, setShowLogin } = useContext(AppContext);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    fetchLists();
  }, [token]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/book/lists`, {
        headers: { token }
      });

      if (response.data.success) {
        setLists(response.data.lists);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
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
            {filteredLists.map((item) => (
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
<<<<<<< HEAD
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-36 bg-gray-700 rounded flex items-center justify-center">
=======
                          e.target.onerror = null;
                          e.target.parentElement.innerHTML = '<div class="w-24 h-36 bg-gradient-to-br from-gray-700 to-gray-600 rounded flex items-center justify-center"><span class="text-4xl">📚</span></div>';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-36 bg-gradient-to-br from-gray-700 to-gray-600 rounded flex items-center justify-center">
>>>>>>> origin/master
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
                    <p className="text-gray-400 mb-2">by {item.book.author}</p>

                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(item.book.averageRating)}
                      <span className="text-sm text-gray-400">
                        {item.book.averageRating.toFixed(1)} ({item.book.totalRatings} ratings)
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
                      {!item.dateStarted && !item.dateFinished && (
                        <span>
                          Added: {new Date(item.dateAdded).toLocaleDateString()}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLists;
