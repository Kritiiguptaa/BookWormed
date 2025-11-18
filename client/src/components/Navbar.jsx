import { useContext, useState, useEffect } from 'react';
import { assets } from '../assests/assets.js';
// 1. Imported useNavigate
import { Link, useNavigate } from 'react-router-dom'; 
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Navbar = () => {
    // 2. Added 'credit' to context
    const { user, setShowLogin, logout, credit, backendUrl, token } = useContext(AppContext);
    // 3. Initialized navigate hook
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (token && user) {
            fetchUnreadCount();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [token, user]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/notification/unread-count`, {
                headers: { token }
            });
            if (data.success) {
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    return (
        <header className="bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side Links */}
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="text-2xl font-bold text-emerald-400">BookWorm</Link>
                        <div className="hidden md:flex items-baseline space-x-4">
                            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Home</Link>
                            <Link to="/books" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Books</Link>
                            {user && (
                                <Link to="/my-lists" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">My Lists</Link>
                            )}
                            <Link to="/posts" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Posts</Link>
                            <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">About</Link>
                            {user && (
                                <Link to="/friends" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Following</Link>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Auth */}
                    <div>
                        {user ? (
                            // Logged-in state
                            <div className="flex items-center gap-4">
                                <Link to="/search" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                    Search
                                </Link>

                                {/* === 4. ADDED CREDITS BUTTON === */}
                                <button
                                    onClick={() => navigate('/buy')}
                                    className="flex items-center gap-2 text-white px-3 py-2 rounded-md text-sm font-medium hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    <img className="w-5" src={assets.credit_star} alt="Credits" />
                                    <p className="text-xs sm:text-sm font-medium">Credits Left: {credit}</p>
                                </button>
                                {/* ================================ */}



                                {/* Notification Bell */}
                                <Link to="/notifications" className="relative px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                    <span className="text-xl">🔔</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {/* User info - Click to view profile */}
                                {user && user._id ? (
                                    <Link to={`/profile/${user._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                                        <img
                                            className="h-8 w-8 rounded-full object-cover"
                                            src={assets.profile_icon}
                                            alt="User Avatar"
                                            title="View Profile"
                                        />
                                        <span className="text-gray-300 max-sm:hidden">{`Hi, @${user.username || user.email?.split('@')[0] || 'user'}`}</span>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <img
                                            className="h-8 w-8 rounded-full object-cover"
                                            src={assets.profile_icon}
                                            alt="User Avatar"
                                        />
                                        <span className="text-gray-300 max-sm:hidden">Loading...</span>
                                    </div>
                                )}
                                
                                {/* Logout Button */}
                                <button
                                    onClick={logout}
                                    className="bg-blue-500 text-white px-7 py-2 text-sm rounded-full"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            // Logged-out state
                            <div className="flex items-center gap-2 sm:gap-5">
                                {/* === 5. ADDED PRICING LINK === */}
                                <p onClick={()=>navigate('/buy')} className='cursor-pointer text-gray-300 hover:text-white transition-colors'>Pricing</p>
                                {/* ============================= */}
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="bg-blue-500 text-white px-7 py-2 sm:px-10 text-sm rounded-full"
                                >
                                    Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;