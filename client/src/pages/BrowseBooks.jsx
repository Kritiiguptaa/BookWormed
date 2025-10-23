import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BrowseBooks = () => {
  const { backendUrl } = useContext(AppContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: '',
    author: '',
    year: '',
    minRating: '',
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBooks();
  }, [filters, page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await axios.get(`${backendUrl}/api/book/browse?${queryParams}`);
      
      if (response.data.success) {
        setBooks(response.data.books);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Books</h1>
          <p className="text-gray-400">Discover your next favorite book</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              name="author"
              placeholder="Filter by author"
              value={filters.author}
              onChange={handleFilterChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="year"
              placeholder="Publication year"
              value={filters.year}
              onChange={handleFilterChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Min Rating</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
              <option value="title">Title (A-Z)</option>
            </select>
            <button
              onClick={() => {
                setFilters({
                  genre: '',
                  author: '',
                  year: '',
                  minRating: '',
                  sortBy: 'newest'
                });
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <Link
                  key={book._id}
                  to={`/books/${book._id}`}
                  className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                >
                  {book.coverImage && (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {!book.coverImage && (
                    <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                      <span className="text-6xl">📚</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{book.author}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {renderStars(book.averageRating)}
                        <span className="text-sm text-gray-400 ml-1">
                          ({book.totalRatings})
                        </span>
                      </div>
                      {book.publicationYear && (
                        <span className="text-xs text-gray-500">{book.publicationYear}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {books.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No books found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseBooks;
