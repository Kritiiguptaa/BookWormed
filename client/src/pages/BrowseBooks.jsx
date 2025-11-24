import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import localBooks from '../data/books.json';
import { assets } from '../assests/assets.js';
import { normalizeKey, sanitizeImageUrl, makePubDataMap } from '../utils/bookUtils';

const BrowseBooks = () => {
  const { backendUrl, token, user, setShowLogin, subscription } = useContext(AppContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useClientPagination, setUseClientPagination] = useState(false);
  const CLIENT_PAGE_SIZE = 20;

  // Genres loaded from data (client/public/genres.json)
  const [genresList, setGenresList] = useState([{ value: '', label: 'Popular Categories' }]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const resp = await fetch('/genres.json');
        if (resp.ok) {
          const data = await resp.json();
          // Ensure default option at start
          const opts = [{ value: '', label: 'Popular Categories' }, ...data];
          setGenresList(opts);
        }
      } catch (e) {
        console.warn('Failed to load genres.json', e);
      }
    };
    loadGenres();
  }, []);

  // Popular genres to show as quick filters (values should match genresList.value)
  const popularGenres = [
    'romance',
    'fiction',
    'history',
    'mystery',
    'horror',
    'fantasy',
    'classics',
    'philosophy',
    'literature',
    'poetry',
    'non-fiction'
  ];

  const handleCategoryInputChange = (val) => {
    // Try to map typed value to an existing genre option (match normalized label)
    const match = genresList.find(g => normalizeSearch(g.label) === normalizeSearch(val) || g.value === String(val).toLowerCase());
    const newVal = match ? match.value : String(val || '').toLowerCase();
    setFilters(prev => ({ ...prev, category: newVal }));
    setPage(1);
  };

  useEffect(() => {
    // Try backend fetch first; fallback to local sample data
    fetchBooks();
  }, [filters, page, searchQuery]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // If category or genre filters are active, load the full client dataset
      // so filtering happens over the entire collection rather than backend pagination.
      if (filters.category && String(filters.category).trim() !== '') {
        try {
          const publicResp = await fetch('/books_full.json');
          if (publicResp.ok) {
            const pubData = await publicResp.json();
            const mappedPub = pubData.map((b, idx) => ({
              _id: b._id || `public-${idx}`,
              title: b.Book || b.title || '',
              author: b.Author || b.author || '',
              synopsis: b.Description || b.synopsis || '',
              genres: parseGenres(b.Genres || b.genres),
              averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
              totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
              coverImage: sanitizeImageUrl(b.Image_URL || b.Image || b.coverImage || ''),
              amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
              url: b.URL || b.url || ''
            }));
            setBooks(mappedPub);
            setUseClientPagination(true);
            setTotalPages(Math.max(1, Math.ceil(mappedPub.length / CLIENT_PAGE_SIZE)));
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to load public books for category/genre full-filter fallback:', e);
        }
      }
      // If the user has entered a search query, prefer the full client JSON
      // so we can show all matching results without backend pagination.
      if (searchQuery && String(searchQuery).trim() !== '') {
        try {
          const publicResp = await fetch('/books_full.json');
          if (publicResp.ok) {
            const pubData = await publicResp.json();
            const mappedPub = pubData.map((b, idx) => {
              return {
                _id: b._id || `public-${idx}`,
                title: b.Book || b.title || '',
                author: b.Author || b.author || '',
                synopsis: b.Description || b.synopsis || '',
                genres: parseGenres(b.Genres || b.genres),
                averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
                totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
                coverImage: sanitizeImageUrl(b.Image_URL || b.Image || b.coverImage || ''),
                amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
                url: b.URL || b.url || ''
              };
            });
            setBooks(mappedPub);
            setTotalPages(1);
            setLoading(false);
            return;
          }
          // If the user has applied a category or genre filter, prefer the full client JSON
          // so filtering by genre/category is applied to the whole dataset (not just paginated server results).
          if (filters.category && String(filters.category).trim() !== '') {
            try {
              const publicResp2 = await fetch('/books_full.json');
              if (publicResp2.ok) {
                const pubData2 = await publicResp2.json();
                const mappedPub2 = pubData2.map((b, idx) => ({
                  _id: b._id || `public-${idx}`,
                  title: b.Book || b.title || '',
                  author: b.Author || b.author || '',
                  synopsis: b.Description || b.synopsis || '',
                  genres: parseGenres(b.Genres || b.genres),
                  averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
                  totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
                  coverImage: sanitizeImageUrl(b.Image_URL || b.Image || b.coverImage || ''),
                  amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
                  url: b.URL || b.url || ''
                }));
                setBooks(mappedPub2);
                setTotalPages(1);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.warn('Failed to load public books for category/genre filter fallback:', e);
            }
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
              const pubMap = makePubDataMap(pubData);
              serverBooks = serverBooks.map(sb => {
                const key = normalizeKey(sb.title || sb.Book || '', sb.author || sb.Author || '');
                const entry = pubMap.get(key);
                // supplement missing coverImage and genres from public data when available
                const cover = (!sb.coverImage || sb.coverImage === '') && entry && entry.coverImage ? entry.coverImage : (sb.coverImage || '');
                // prefer existing server genres, otherwise use public raw genres
                let genres = sb.genres && Array.isArray(sb.genres) && sb.genres.length ? sb.genres : [];
                if (( !genres || genres.length === 0 ) && entry && entry.raw) {
                  const rawG = entry.raw.Genres || entry.raw.genres || [];
                  genres = Array.isArray(rawG) ? rawG : (typeof rawG === 'string' ? parseGenres(rawG) : []);
                }
                return { ...sb, coverImage: cover, genres };
              });
            }
          } catch (e) {
            // ignore public JSON errors and use server data as-is
            console.warn('Failed to load public books for image supplement:', e);
          }
          // If the user provided a search query, also apply client-side filtering
          // so they can search by title or author even when server returned results.
          if (searchQuery && String(searchQuery).trim() !== '') {
            const qNorm = normalizeSearch(searchQuery);
            if (qNorm !== '') {
              serverBooks = serverBooks.filter(b => {
                const t = normalizeSearch(b.title || '');
                const a = normalizeSearch(b.author || '');
                return (t.includes(qNorm) || a.includes(qNorm));
              });
            }
          }

          setBooks(serverBooks);
          setUseClientPagination(false);
          setTotalPages(response.data.totalPages || 1);
          return;
        }
      } catch (err) {
        // ignore and fall back to local
      }

      // Try loading public dataset generated from your Excel (client/public/books_full.json)
      try {
        console.log('Attempting to load /books_full.json...');
        const publicResp = await fetch('/books_full.json');
        console.log('Fetch response status:', publicResp.status, publicResp.ok);
        if (publicResp.ok) {
          const pubData = await publicResp.json();
          console.log('Loaded', pubData.length, 'books from /books_full.json');
          console.log('Sample book raw data:', pubData[0]);
          const mappedPub = pubData.map((b, idx) => {
              const parsedGenres = parseGenres(b.Genres || b.genres);
              if (idx < 3) {
                console.log('Book', idx, ':', b.Book, 'raw genres:', b.Genres, 'typeof:', typeof b.Genres, 'parsed:', parsedGenres);
              }
              return {
              _id: b._id || `public-${idx}`,
              title: b.Book || b.title || '',
              author: b.Author || b.author || '',
              synopsis: b.Description || b.synopsis || '',
              genres: parseGenres(b.Genres || b.genres),
              averageRating: b.Avg_Rating || b.AvgRating || b.averageRating || 0,
              totalRatings: b.Num_Ratings || b.NumRatings || b.totalRatings || 0,
              coverImage: sanitizeImageUrl(b.Image_URL || b.Image || b.coverImage || ''),
              amazonUrl: b.Amazon_URL || b.AmazonURL || b.Amazon || b.AmazonUrl || '',
              url: b.URL || b.url || ''
            };
          });
          setBooks(mappedPub);
          setUseClientPagination(true);
          setTotalPages(Math.max(1, Math.ceil(mappedPub.length / CLIENT_PAGE_SIZE)));
          return;
        }
      } catch (err) {
        // ignore and fall back to local bundle
      }

      // Use local sample data (map fields to expected shape)
      console.log('Using local sample data from localBooks');
      console.log('Sample local book:', localBooks[0]);
      const mapped = localBooks.map((b, idx) => {
        const parsedGenres = parseGenres(b.Genres);
        if (idx < 3) {
          console.log('Local book', idx, ':', b.Book, 'raw genres:', b.Genres, 'parsed:', parsedGenres);
        }
        return {
        _id: `local-${idx}`,
        title: b.Book,
        author: b.Author,
        synopsis: b.Description,
        genres: parsedGenres,
        averageRating: b.Avg_Rating || 0,
        totalRatings: b.Num_Ratings || 0,
        coverImage: b.Image_URL || '',
        url: b.URL || ''
      };
      });

      setBooks(mapped);
      setUseClientPagination(true);
      setTotalPages(Math.max(1, Math.ceil(mapped.length / CLIENT_PAGE_SIZE)));
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

  // Normalize strings for search comparisons: lowercase and strip non-alphanumerics
  const normalizeSearch = (s) => {
    try {
      return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    } catch (e) {
      return '';
    }
  };

  // Parse genres field to ensure it's always an array
  const parseGenres = (g) => {
    if (!g) return [];
    if (Array.isArray(g)) return g;
    if (typeof g === 'string') {
      const trimmed = g.trim();
      if (trimmed.startsWith('[')) {
        try {
          // Handle Python-style lists with single quotes
          const jsonStr = trimmed.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          return Array.isArray(parsed) ? parsed : [g];
        } catch (e) {
          // If parsing fails, try extracting quoted strings
          const matches = trimmed.match(/'([^']+)'/g);
          if (matches) {
            return matches.map(m => m.slice(1, -1));
          }
          return [g];
        }
      }
      return [g];
    }
    return [String(g)];
  };

  const filteredAndSortedBooks = () => {
    let list = Array.isArray(books) ? [...books] : [];

    try {

    // search by title or author (normalized so punctuation/spaces are ignored)
    if (searchQuery && searchQuery.trim() !== '') {
      const qNorm = normalizeSearch(searchQuery);
      if (qNorm !== '') {
        list = list.filter(b => {
          const t = normalizeSearch(b.title || '');
          const a = normalizeSearch(b.author || '');
          return (t.includes(qNorm) || a.includes(qNorm));
        });
      }
    }

    // min rating filter
    if (filters.minRating) {
      const min = Number(filters.minRating);
      list = list.filter(b => (b.averageRating || 0) >= min);
    }

    // genre filter removed; use category/searchable genres instead

    // category filter - match against book's genres array
    if (filters.category) {
      const catNorm = normalizeSearch(filters.category);
      console.log('Filtering by category:', filters.category, 'normalized:', catNorm);
      const beforeCount = list.length;
      list = list.filter(b => {
        // genres should already be an array from data loading
        const bookGenres = Array.isArray(b.genres) ? b.genres : parseGenres(b.genres);
        console.log('Book:', b.title, 'raw genres:', b.genres, 'parsed:', bookGenres);
        if (bookGenres.length === 0) {
          console.log('No genres for:', b.title);
          return false;
        }
        // Check if any genre in the book matches the selected category
        const matches = bookGenres.some(g => {
          const genreNorm = normalizeSearch(g);
          const match = genreNorm.includes(catNorm) || catNorm.includes(genreNorm);
          if (match) {
            console.log('MATCH found:', g, 'normalized:', genreNorm, 'matches', catNorm);
          }
          return match;
        });
        return matches;
      });
      console.log('Filtered from', beforeCount, 'to', list.length, 'books');
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
      (!filters.category || filters.category === '') &&
      (!filters.minRating || filters.minRating === '') &&
      (filters.sortBy === 'newest')
    );
  };

  // Decide which books to render: default show only first N when no search/filters
  const booksToDisplay = () => {
    const all = filteredAndSortedBooks();
    const noSearch = !searchQuery || searchQuery.trim() === '';
    if (noSearch && isFiltersEmpty()) {
      // show only first page by default
      return all.slice(0, CLIENT_PAGE_SIZE);
    }
    if (useClientPagination) {
      const start = (page - 1) * CLIENT_PAGE_SIZE;
      return all.slice(start, start + CLIENT_PAGE_SIZE);
    }
    return all;
  };

  // Keep totalPages in sync for client-side pagination when books/filters change
  useEffect(() => {
    if (useClientPagination) {
      const all = filteredAndSortedBooks();
      const tp = Math.max(1, Math.ceil(all.length / CLIENT_PAGE_SIZE));
      setTotalPages(tp);
      if (page > tp) setPage(tp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, filters, searchQuery, useClientPagination]);

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
  const [selectedListType, setSelectedListType] = useState('');
  const [addingToList, setAddingToList] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  // prevent background scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

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
    
    // If editing, use the update handler instead
    if (editingReviewId) {
      return handleUpdateReview(e);
    }
    
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

  const handleAddToList = async () => {
    if (!token) {
      setShowLogin(true);
      closeModal();
      return;
    }
    
    // Check for premium access
    if (!subscription?.hasPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (!selectedBook || !selectedBook._id || String(selectedBook._id).startsWith('local-') || String(selectedBook._id).startsWith('public-')) {
      alert('This book is not connected to the server — cannot add sample entries to lists.');
      return;
    }
    if (!selectedListType) {
      alert('Please select a list');
      return;
    }
    try {
      setAddingToList(true);
      const resp = await axios.post(
        `${backendUrl}/api/book/${selectedBook._id}/list`,
        { listType: selectedListType },
        { headers: { token } }
      );
      if (resp.data.success) {
        alert(resp.data.message || 'Book added to list!');
        setSelectedListType('');
      } else {
        alert(resp.data.message || 'Failed to add book to list');
      }
    } catch (err) {
      console.error('Error adding to list', err, err.response?.data);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      
      // Check if server returned requiresPremium flag
      if (err.response?.data?.requiresPremium) {
        setShowPremiumModal(true);
        return;
      }
      
      alert(serverMsg || 'Error adding book to list');
    } finally {
      setAddingToList(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewText(review.reviewText);
    setReviewRating(review.rating);
    setReviewVisibility(review.visibility || 'public');
    // Scroll to review form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowLogin(true);
      return;
    }
    if (!editingReviewId || !reviewRating || !reviewText.trim()) {
      alert('Please provide both rating and review text');
      return;
    }
    try {
      setPostingReview(true);
      const resp = await axios.put(
        `${backendUrl}/api/book/review/${editingReviewId}`,
        { rating: reviewRating, reviewText: reviewText.trim(), visibility: reviewVisibility },
        { headers: { token } }
      );
      if (resp.data.success) {
        // Update the review in the list
        setReviews(prev => prev.map(r => r._id === editingReviewId ? resp.data.review : r));
        setReviewText('');
        setReviewRating(0);
        setReviewVisibility('public');
        setEditingReviewId(null);
        alert('Review updated successfully!');
        // Refresh book details to get updated ratings
        if (selectedBook && selectedBook._id) {
          fetchBookDetails(selectedBook._id);
        }
      }
    } catch (err) {
      console.error('Error updating review', err, err.response?.data);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(serverMsg || 'Error updating review');
    } finally {
      setPostingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    try {
      setDeletingReviewId(reviewId);
      const resp = await axios.delete(
        `${backendUrl}/api/book/review/${reviewId}`,
        { headers: { token } }
      );
      if (resp.data.success) {
        // Remove the review from the list
        setReviews(prev => prev.filter(r => r._id !== reviewId));
        alert('Review deleted successfully!');
        // Refresh book details to get updated ratings
        if (selectedBook && selectedBook._id) {
          fetchBookDetails(selectedBook._id);
        }
      }
    } catch (err) {
      console.error('Error deleting review', err, err.response?.data);
      const serverMsg = err.response?.data?.message || err.response?.data || err.message;
      alert(serverMsg || 'Error deleting review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setReviewText('');
    setReviewRating(0);
    setReviewVisibility('public');
  };

  const closeModal = () => {
    setSelectedBook(null);
    setShowModal(false);
    // Clear review form state when closing
    setReviewText('');
    setReviewRating(0);
    setReviewVisibility('public');
    setEditingReviewId(null);
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by title or author"
              value={searchQuery}
              onChange={handleSearchChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Popular Categories</option>
              {popularGenres.map(genre => (
                <option key={genre} value={genre}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
              ))}
            </select>
            <input
              type="text"
              list="all-genres-list"
              placeholder="Or search all genres..."
              value={filters.category ? (genresList.find(g => g.value === filters.category)?.label || filters.category) : ''}
              onChange={(e) => handleCategoryInputChange(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="all-genres-list">
              {genresList.filter(g => g.value !== '').map(genre => (
                <option key={genre.value} value={genre.label} />
              ))}
            </datalist>
            {/* removed separate "filter by genre" input - use the searchable genres input above */}
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
                  category: '',
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
                onClick={(e) => {
                  // close modal when clicking the overlay (outside the dialog)
                  if (e.target === e.currentTarget) closeModal();
                }}
              >
                <div className="bg-gray-800 max-w-3xl w-full rounded-lg overflow-hidden my-8 max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-start p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{selectedBook.title}</h3>
                    <button onClick={closeModal} className="text-gray-300 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto flex-1">                    <div>
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

                      {/* Add to List Section */}
                      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <h4 className="text-lg font-semibold text-white mb-3">Add to Your Reading List</h4>
                        {token ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedListType}
                              onChange={(e) => setSelectedListType(e.target.value)}
                              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Add to list...</option>
                              <option value="want-to-read">📚 Want to Read</option>
                              <option value="currently-reading">📖 Currently Reading</option>
                              <option value="read">✅ Read</option>
                              <option value="favorites">⭐ Favorites</option>
                            </select>
                            <button
                              onClick={handleAddToList}
                              disabled={addingToList || !selectedListType}
                              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                              {addingToList ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">
                            Please{' '}
                            <button
                              type="button"
                              className="text-blue-400 underline hover:text-blue-300"
                              onClick={() => {
                                closeModal();
                                setShowLogin(true);
                                window.scrollTo(0, 0);
                              }}
                            >
                              login
                            </button>{' '}
                            to add books to your reading lists.
                          </p>
                        )}
                      </div>

                      {/* Reviews Section */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Reviews</h4>

                        <div className="mb-4">
                          {token ? (
                            <form onSubmit={handleSubmitReview} className="space-y-3">
                              {editingReviewId && (
                                <div className="bg-blue-900/30 border border-blue-500 rounded p-2 text-sm text-blue-300">
                                  ✏️ Editing review
                                </div>
                              )}
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
                                <button type="submit" disabled={postingReview} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded">
                                  {postingReview ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                                </button>
                                {editingReviewId ? (
                                  <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Cancel</button>
                                ) : (
                                  <button type="button" onClick={() => { setReviewText(''); setReviewRating(0); setReviewVisibility('public'); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Reset</button>
                                )}
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
                                    {r.isEdited && <span className="ml-1 text-gray-500">(edited)</span>}
                                  </span>
                                  {/* Edit/Delete buttons for own reviews */}
                                  {user && r.user === user._id && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditReview(r)}
                                        className="text-blue-400 hover:text-blue-300 text-xs"
                                        title="Edit review"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteReview(r._id)}
                                        disabled={deletingReviewId === r._id}
                                        className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                                        title="Delete review"
                                      >
                                        {deletingReviewId === r._id ? '⏳' : '🗑️'}
                                      </button>
                                    </div>
                                  )}
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
      
      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPremiumModal(false)}>
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-6xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-white mb-4">Upgrade to Premium</h2>
              <p className="text-gray-300 mb-6">
                Adding books to your lists is a premium feature. Upgrade now to unlock:
              </p>
              <ul className="text-left text-gray-300 mb-6 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited Book Lists
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Personalized Recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 1 Month Free Trial
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  to="/subscription"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseBooks;
