import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import localBooks from '../data/books.json';
import { assets } from '../assests/assets.js';

const BrowseBooks = () => {
  const { backendUrl, token, user, setShowLogin } = useContext(AppContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
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
    // Try backend fetch first; fallback to local sample data
    fetchBooks();
  }, [filters, page, searchQuery]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // If the user has entered a search query, prefer the full client JSON
      // so we can show all matching results without backend pagination.
      if (searchQuery && String(searchQuery).trim() !== '') {
        try {
          const publicResp = await fetch('/books_full.json');
          if (publicResp.ok) {
            const pubData = await publicResp.json();
            const mappedPub = pubData.map((b, idx) => {
              let genres = b.Genres || b.genres || [];
              if (typeof genres === 'string' && genres.trim().startsWith('[')) {
                try { genres = JSON.parse(genres.replace(/'/g, '"')); } catch (e) { genres = [genres]; }
              }
              return {
                _id: b._id || `public-${idx}`,
                title: b.Book || b.title || '',
                author: b.Author || b.author || '',
                synopsis: b.Description || b.synopsis || '',
                genres: genres || [],
                averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
                totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
                coverImage: b.Image_URL || b.Image || b.coverImage || '',
                amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
                url: b.URL || b.url || ''
              };
            });
            setBooks(mappedPub);
            setTotalPages(1);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to load public books for search fallback:', e);
        }
      }
      // attempt backend fetch but don't fail hard — show local data when unavailable
      try {
        const queryParams = new URLSearchParams({
          page,
          limit: 20,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
        });
        const response = await axios.get(`${backendUrl}/api/book/browse?${queryParams}`);
        if (response.data.success && Array.isArray(response.data.books) && response.data.books.length > 0) {
          // If server books lack coverImage, try to supplement from client/public/books_full.json
          let serverBooks = response.data.books;
          try {
            const pubResp = await fetch('/books_full.json');
            if (pubResp.ok) {
              const pubData = await pubResp.json();
              const map = new Map();
              for (const b of pubData) {
                const key = `${String(b.Book || b.title || '').toLowerCase()}___${String(b.Author || b.author || '').toLowerCase()}`;
                map.set(key, b);
              }
              serverBooks = serverBooks.map(sb => {
                const key = `${String(sb.title || sb.Book || '').toLowerCase()}___${String(sb.author || sb.Author || '').toLowerCase()}`;
                if ((!sb.coverImage || sb.coverImage === '') && map.has(key)) {
                  const m = map.get(key);
                  return { ...sb, coverImage: m.Image_URL || m.Image || '' };
                }
                return sb;
              });
            }
          } catch (e) {
            // ignore public JSON errors and use server data as-is
            console.warn('Failed to load public books for image supplement:', e);
          }

          setBooks(serverBooks);
          setTotalPages(response.data.totalPages || 1);
          return;
        }
      } catch (err) {
        // ignore and fall back to local
      }

      // Try loading public dataset generated from your Excel (client/public/books_full.json)
      try {
        const publicResp = await fetch('/books_full.json');
        if (publicResp.ok) {
          const pubData = await publicResp.json();
          const mappedPub = pubData.map((b, idx) => {
            // normalize genres field (some rows store genres as stringified list)
            let genres = b.Genres || b.genres || [];
            if (typeof genres === 'string' && genres.trim().startsWith('[')) {
              try {
                genres = JSON.parse(genres.replace(/'/g, '"'));
              } catch (e) {
                // fallback: keep as single string
                genres = [genres];
              }
            }

            return {
              _id: b._id || `public-${idx}`,
              title: b.Book || b.title || '',
              author: b.Author || b.author || '',
              synopsis: b.Description || b.synopsis || '',
              genres: genres || [],
              averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
              totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
              coverImage: b.Image_URL || b.Image_URL || b.Image || b.coverImage || '',
              amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
              url: b.URL || b.url || ''
            };
          });
          setBooks(mappedPub);
          setTotalPages(1);
          return;
        }
      } catch (err) {
        // ignore and fall back to local bundle
      }

      // Use local sample data (map fields to expected shape)
      const mapped = localBooks.map((b, idx) => ({
        _id: `local-${idx}`,
        title: b.Book,
        author: b.Author,
        synopsis: b.Description,
        genres: b.Genres || [],
        averageRating: b.Avg_Rating || 0,
        totalRatings: b.Num_Ratings || 0,
        coverImage: b.Image_URL || '',
        url: b.URL || ''
      }));

      setBooks(mapped);
      setTotalPages(1);
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const r = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(r) ? 'text-yellow-400' : 'text-gray-600'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredAndSortedBooks = () => {
    let list = Array.isArray(books) ? [...books] : [];

    try {

    // search by title or author
    if (searchQuery && searchQuery.trim() !== '') {
      const q = String(searchQuery).toLowerCase();
      list = list.filter(b => String(b.title || '').toLowerCase().includes(q) || String(b.author || '').toLowerCase().includes(q));
    }

    // min rating filter
    if (filters.minRating) {
      const min = Number(filters.minRating);
      list = list.filter(b => (b.averageRating || 0) >= min);
    }

    // genre filter
    if (filters.genre) {
      const g = String(filters.genre).toLowerCase();
      list = list.filter(b => (b.genres || []).some(gg => String(gg).toLowerCase().includes(g)));
    }

    // sorting
    if (filters.sortBy === 'rating') {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (filters.sortBy === 'popularity' || filters.sortBy === 'trending') {
      list.sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0));
    } else if (filters.sortBy === 'title') {
      list.sort((a, b) => ('' + (a.title || '')).localeCompare(b.title || ''));
    }

    } catch (err) {
      console.error('Error filtering/sorting books:', err);
      return [];
    }
    return list;
  };

  const isFiltersEmpty = () => {
    return (
      (!filters.genre || filters.genre === '') &&
      (!filters.author || filters.author === '') &&
      (!filters.year || filters.year === '') &&
      (!filters.minRating || filters.minRating === '') &&
      (filters.sortBy === 'newest')
    );
  };

  // Decide which books to render: default show only first N when no search/filters
  const booksToDisplay = () => {
    const all = filteredAndSortedBooks();
    const noSearch = !searchQuery || searchQuery.trim() === '';
    if (noSearch && isFiltersEmpty()) {
      // show only first 20 by default
      return all.slice(0, 20);
    }
    return all;
  };

  const openDetails = (book) => {
    setSelectedBook(book);
    setShowModal(true);
    // If this looks like a server-backed book, fetch its reviews/details
    if (book._id && !String(book._id).startsWith('local-') && !String(book._id).startsWith('public-')) {
      fetchBookDetails(book._id);
    } else {
      setReviews([]);
    }
  };

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [postingReview, setPostingReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewVisibility, setReviewVisibility] = useState('public');

  const fetchBookDetails = async (bookId) => {
    try {
      setLoadingReviews(true);
      const resp = await axios.get(`${backendUrl}/api/book/${bookId}`, { headers: { token } });
      if (resp.data.success) {
        setReviews(resp.data.reviews || []);
        if (resp.data.book) {
          setSelectedBook(prev => ({ ...prev, averageRating: resp.data.book.averageRating, totalRatings: resp.data.book.totalRatings }));
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowLogin(true);
      closeModal();
      return;
    }
    if (!selectedBook || !selectedBook._id || String(selectedBook._id).startsWith('local-') || String(selectedBook._id).startsWith('public-')) {
      alert('This book is not connected to the server — reviews cannot be saved for sample entries.');
      return;
    }
    if (!reviewRating || !reviewText.trim()) {
      alert('Please provide both rating and review text');
      return;
    }
    try {
      setPostingReview(true);
      const resp = await axios.post(
        `${backendUrl}/api/book/${selectedBook._id}/review`,
        { rating: reviewRating, reviewText: reviewText.trim(), visibility: reviewVisibility },
        { headers: { token, Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        if (resp.data.review) setReviews(prev => [resp.data.review, ...prev]);
        setReviewText(''); setReviewRating(0); setReviewVisibility('public');
        if (resp.data.book) {
          setSelectedBook(prev => ({ ...prev, averageRating: resp.data.book.averageRating, totalRatings: resp.data.book.totalRatings }));
        }
        alert(resp.data.message || 'Review submitted');
      }
    } catch (err) {
      console.error('Error submitting review', err, err.response?.data);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(serverMsg || 'Error adding review');
    } finally {
      setPostingReview(false);
    }
  };

  const closeModal = () => {
    setSelectedBook(null);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Books</h1>
          <p className="text-gray-400">Discover your next favorite book</p>
        </div>

        {/* Filters + Search */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by title or author"
              value={searchQuery}
              onChange={handleSearchChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              <option value="trending">Trending (by ratings)</option>
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
                setSearchQuery('');
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
              {booksToDisplay().map((book) => (
                <div
                  key={book._id}
                  onClick={() => openDetails(book)}
                  className="cursor-pointer bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = '<div class="w-full h-64 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center"><span class="text-5xl">📚</span></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                      <span className="text-5xl">📚</span>
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
                        <span className="text-sm text-gray-400 ml-1">({book.totalRatings})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Details Modal */}
            {showModal && selectedBook && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
                onClick={(e) => {
                  // close modal when clicking the overlay (outside the dialog)
                  if (e.target === e.currentTarget) closeModal();
                }}
              >
                <div className="bg-gray-800 max-w-3xl w-full rounded-lg overflow-hidden my-8 max-h-[80vh]">
                  <div className="flex justify-between items-start p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{selectedBook.title}</h3>
                    <button onClick={closeModal} className="text-gray-300 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto" style={{maxHeight: 'calc(80vh - 64px)'}}>
                    <div>
                      {selectedBook.coverImage ? (
                        <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-auto rounded max-h-[60vh] object-contain" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-6xl">📚</span>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-300 mb-2">by <span className="text-white">{selectedBook.author}</span></p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center">{renderStars(selectedBook.averageRating)}</div>
                        <span className="text-sm text-gray-400">{(selectedBook.averageRating || 0).toFixed(2)} • {selectedBook.totalRatings} ratings</span>
                      </div>
                      <div className="text-gray-300 whitespace-pre-wrap mb-3">{selectedBook.synopsis || 'No description available.'}</div>
                      {selectedBook.genres && selectedBook.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedBook.genres.map((g, i) => (
                            <span key={i} className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full">{g}</span>
                          ))}
                        </div>
                      )}
                      {selectedBook.amazonUrl && (
                        <a href={selectedBook.amazonUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Buy on Amazon</a>
                      )}
                      {/* Reviews Section */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Reviews</h4>

                        <div className="mb-4">
                          {token ? (
                            <form onSubmit={handleSubmitReview} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center cursor-pointer">
                                  {[1,2,3,4,5].map(i => (
                                    <span
                                      key={i}
                                      onMouseEnter={() => setReviewRating(i)}
                                      onClick={() => setReviewRating(i)}
                                      className={`text-2xl ${i <= reviewRating ? 'text-yellow-400' : 'text-gray-600'} cursor-pointer`}
                                    >★</span>
                                  ))}
                                </div>
                              </div>
                              <textarea value={reviewText} onChange={(e)=>setReviewText(e.target.value)} placeholder="Write your review..." className="w-full px-3 py-2 bg-gray-700 text-white rounded resize-none" rows={4} />
                              <div className="flex items-center gap-2">
                                <button type="submit" disabled={postingReview} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                                  {postingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button type="button" onClick={() => { setReviewText(''); setReviewRating(0); setReviewVisibility('public'); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Reset</button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-sm text-gray-400">Please <button type="button" className="text-blue-400 underline" onClick={() => { closeModal(); setShowLogin(true); window.scrollTo(0,0); }}>login</button> to add a review.</p>
                          )}
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                          {loadingReviews ? (
                            <p className="text-gray-400">Loading reviews...</p>
                          ) : reviews.length === 0 ? (
                            <p className="text-gray-400">No reviews yet.</p>
                          ) : (
                            reviews.map(r => (
                              <div key={r._id} className="p-3 bg-gray-700 rounded">
                                <div className="flex items-center gap-3 mb-2">
                                  <Link
                                    to={`/profile/${r.user}`}
                                    className="flex items-center gap-2 hover:opacity-80 transition"
                                  >
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                                      @
                                    </div>
                                    <span className="font-semibold text-white">
                                      @{r.userName || 'unknown'}
                                    </span>
                                  </Link>
                                  <span className="ml-auto text-xs text-gray-400">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                  {renderStars(r.rating)}
                                </div>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{r.reviewText}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredAndSortedBooks().length === 0 && (
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
