import { useContext, useState, useEffect } from 'react';
import { assets } from '../assests/assets.js';
// 1. Imported useNavigate
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'; 
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Navbar = () => {
    // 2. Added 'subscription' to context
    const { user, setShowLogin, logout, subscription, backendUrl, token, isLoadingUser } = useContext(AppContext);
    // 3. Initialized navigate hook
    const navigate = useNavigate();
    const location = useLocation();
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
                        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">BookWormed</Link>
                        <div className="hidden md:flex items-baseline space-x-4">
                            <NavLink
                                to="/"
                                onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/books"
                                onClick={(e) => { if (location.pathname === '/books') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Books
                            </NavLink>
                            {user && (
                                <NavLink
                                    to="/recommendations"
                                    onClick={(e) => { if (location.pathname === '/recommendations') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    Recommendations ⭐
                                </NavLink>
                            )}
                            {user && (
                                <NavLink
                                    to="/my-lists"
                                    onClick={(e) => { if (location.pathname === '/my-lists') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    My Lists ⭐
                                </NavLink>
                            )}
                            <NavLink
                                to="/posts"
                                onClick={(e) => { if (location.pathname === '/posts') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Posts
                            </NavLink>
                            <NavLink
                                to="/about"
                                onClick={(e) => { if (location.pathname === '/about') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                About
                            </NavLink>
                            {user && (
                                <NavLink
                                    to="/friends"
                                    onClick={(e) => { if (location.pathname === '/friends') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    Following
                                </NavLink>
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

                                {/* === 4. SUBSCRIPTION BUTTON === */}
                                <button
                                    onClick={() => navigate('/subscription')}
                                    className="flex items-center gap-2 text-white px-3 py-2 rounded-md text-sm font-medium hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    <img className="w-5" src={assets.credit_star} alt="Subscription" />
                                    <p className="text-xs sm:text-sm font-medium">
                                        {subscription?.hasPremium ? (subscription.status === 'trial' ? 'Trial Active' : 'Premium') : 'Free'}
                                    </p>
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
                                        <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse"></div>
                                        <span className="text-gray-400 max-sm:hidden">Loading...</span>
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