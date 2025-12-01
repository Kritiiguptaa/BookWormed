import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { normalizeKey, sanitizeImageUrl, makePubDataMap } from '../utils/bookUtils';

const Recommendations = () => {
  const { user, backendUrl, token, subscription } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Since this is a protected route, user/token should exist
    // Wait for subscription to load before checking premium access
    if (!user || !token) {
      console.log('No user/token in Recommendations');
      return;
    }

    if (subscription === null) {
      console.log('Waiting for subscription data to load...');
      return;
    }
    
    // Check for premium access
    if (!subscription.hasPremium) {
      console.log('No premium access, redirecting to subscription page');
      navigate('/subscription');
      return;
    }
    
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch user's lists
        const { data } = await axios.get(`${backendUrl}/api/book/lists`, {
          headers: { token }
        });

        if (data.success && Array.isArray(data.lists) && data.lists.length > 0) {
            // collect genres from user's lists
            const allGenres = {};
            const bookIdsInLists = new Set();
            data.lists.forEach(item => {
              if (item.book && item.book._id) bookIdsInLists.add(item.book._id.toString());
              if (item.book && Array.isArray(item.book.genres)) {
                item.book.genres.forEach(g => {
                  const key = String(g || '').toLowerCase().trim();
                  if (!key) return;
                  allGenres[key] = (allGenres[key] || 0) + 1;
                });
              }
            });

            // pick top 2 genres
            const topGenres = Object.entries(allGenres)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([g]) => g);

            let recommendations = [];
            for (const genre of topGenres) {
              const res = await axios.get(`${backendUrl}/api/book/browse?genre=${encodeURIComponent(genre)}&limit=12`);
              if (res.data?.success && Array.isArray(res.data.books)) {
                recommendations = recommendations.concat(res.data.books);
              }
            }

            // Try to supplement missing coverImage from public dataset
            try {
              const pubResp = await fetch('/books_full.json');
              if (pubResp.ok) {
                const pubData = await pubResp.json();
                const pubMap = makePubDataMap(pubData);
                recommendations = recommendations.map(rb => {
                  if (!rb) return rb;
                  const key = normalizeKey(rb.title || rb.Book || '', rb.author || rb.Author || '');
                  const entry = pubMap.get(key);
                  if ((!rb.coverImage || rb.coverImage === '') && entry && entry.coverImage) {
                    return { ...rb, coverImage: entry.coverImage };
                  }
                  return rb;
                });
              }
            } catch (e) {
              // ignore public JSON errors
            }

            // dedupe and exclude books already in user's lists
            const uniq = [];
            const seen = new Set();
            for (const b of recommendations) {
              if (!b || !b._id) continue;
              const id = b._id.toString();
              if (bookIdsInLists.has(id)) continue;
              if (seen.has(id)) continue;
              seen.add(id);
              uniq.push(b);
            }

            // fallback: if no recommendations from genres, fetch top-rated
            if (uniq.length === 0) {
              const res = await axios.get(`${backendUrl}/api/book/browse?sortBy=rating&limit=20`);
              if (res.data?.success) {
                // Supplement fallback books too
                let fallbackBooks = res.data.books || [];
                try {
                  const pubResp = await fetch('/books_full.json');
                  if (pubResp.ok) {
                    const pubData = await pubResp.json();
                    const pubMap = makePubDataMap(pubData);
                    fallbackBooks = fallbackBooks.map(rb => {
                      if (!rb) return rb;
                      const key = normalizeKey(rb.title || rb.Book || '', rb.author || rb.Author || '');
                      const entry = pubMap.get(key);
                      if ((!rb.coverImage || rb.coverImage === '') && entry && entry.coverImage) {
                        return { ...rb, coverImage: entry.coverImage };
                      }
                      return rb;
                    });
                  }
                } catch (e) {
                  // ignore
                }
                uniq.push(...fallbackBooks);
              }
            }

            setBooks(uniq.slice(0, 20));
            setLoading(false);
            return;
          } else {
            // If no lists, fetch default highest rated books
            const res = await axios.get(`${backendUrl}/api/book/browse?sortBy=rating&limit=20`);
            if (res.data?.success) {
              let topBooks = res.data.books || [];
              // Supplement with public dataset
              try {
                const pubResp = await fetch('/books_full.json');
                if (pubResp.ok) {
                  const pubData = await pubResp.json();
                  const pubMap = makePubDataMap(pubData);
                  topBooks = topBooks.map(rb => {
                    if (!rb) return rb;
                    const key = normalizeKey(rb.title || rb.Book || '', rb.author || rb.Author || '');
                    const entry = pubMap.get(key);
                    if ((!rb.coverImage || rb.coverImage === '') && entry && entry.coverImage) {
                      return { ...rb, coverImage: entry.coverImage };
                    }
                    return rb;
                  });
                }
              } catch (e) {
                // ignore
              }
              setBooks(topBooks);
            } else {
              setError('Failed to load recommendations');
            }
          }
        } catch (err) {
          console.error('Recommendations error:', err);
          setError(err.response?.data?.message || err.message || 'Error loading recommendations');
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [token, user, backendUrl, subscription, navigate]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-white mb-4">Recommendations</h1>
      {loading && <p className="text-gray-300">Loading recommendations...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && books.length === 0 && !error && (
        <p className="text-gray-300">No recommendations yet. Try searching or adding books to your lists.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
        {books.map(book => (
          <div key={book._id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors">
            <Link to={`/books/${book._id}`} className="block">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center"><span class="text-5xl">📚</span></div>';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                  <span className="text-5xl">📚</span>
                </div>
              )}
              <div className="p-3">
                <h3 className="text-sm font-medium text-white mt-1 line-clamp-2">{book.title}</h3>
                <p className="text-xs text-gray-400 truncate">{book.author}</p>
                <p className="text-xs text-yellow-300 mt-1">{book.averageRating ? `⭐ ${book.averageRating}` : 'No rating'}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
