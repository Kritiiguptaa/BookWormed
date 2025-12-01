import { useContext, useState, useEffect, useRef } from 'react';
import { assets } from '../assests/assets.js';
// 1. Imported useNavigate
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'; 
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Navbar = () => {
    // 2. Added 'subscription' to context
    const { user, setShowLogin, logout, subscription, backendUrl, token, isLoadingUser, notificationCount } = useContext(AppContext);
    // 3. Initialized navigate hook
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const moreRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setMoreOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setMoreOpen(false);
                setProfileOpen(false);
                setMobileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    return (
        <header className="bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
            <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16">
                    {/* Left: Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-6">BookWormed</Link>
                    </div>

                    {/* Center: Nav links (shifted slightly left and tightened spacing to avoid overlap) */}
                    <div className="hidden md:flex items-center space-x-2 justify-start max-w-2xl justify-self-start ml-4">
                            <NavLink
                                to="/"
                                onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/books"
                                onClick={(e) => { if (location.pathname === '/books') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Books
                            </NavLink>

                            {/* Secondary links - hide below XL and move into More dropdown */}
                            {user && (
                                <NavLink
                                    to="/recommendations"
                                    onClick={(e) => { if (location.pathname === '/recommendations') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `hidden lg:inline-block px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    Recommendations ⭐
                                </NavLink>
                            )}
                            {user && (
                                <NavLink
                                    to="/my-lists"
                                    onClick={(e) => { if (location.pathname === '/my-lists') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `hidden lg:inline-block px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    My Lists ⭐
                                </NavLink>
                            )}

                            <NavLink
                                to="/posts"
                                onClick={(e) => { if (location.pathname === '/posts') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                Posts
                            </NavLink>
                            <NavLink
                                to="/about"
                                onClick={(e) => { if (location.pathname === '/about') { e.preventDefault(); window.location.reload(); } }}
                                className={({ isActive }) => `px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                            >
                                About
                            </NavLink>

                            {user && (
                                <NavLink
                                    to="/friends"
                                    onClick={(e) => { if (location.pathname === '/friends') { e.preventDefault(); window.location.reload(); } }}
                                    className={({ isActive }) => `hidden lg:inline-block px-2 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                >
                                    Following
                                </NavLink>
                            )}

                            {/* More dropdown for screens below LG but >= md */}
                            <div className="relative md:inline-block lg:hidden" ref={moreRef}>
                                <button onClick={() => setMoreOpen(!moreOpen)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                                    More ▾
                                </button>
                                {moreOpen && (
                                    <div className="origin-top-left absolute left-0 mt-2 w-44 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            {user && (
                                                <NavLink to="/recommendations" onClick={()=>setMoreOpen(false)} className={({isActive})=>`block px-4 py-2 text-sm ${isActive? 'text-white bg-gray-700':'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                                    Recommendations
                                                </NavLink>
                                            )}
                                            {user && (
                                                <NavLink to="/my-lists" onClick={()=>setMoreOpen(false)} className={({isActive})=>`block px-4 py-2 text-sm ${isActive? 'text-white bg-gray-700':'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                                    My Lists
                                                </NavLink>
                                            )}
                                            {user && (
                                                <NavLink to="/friends" onClick={()=>setMoreOpen(false)} className={({isActive})=>`block px-4 py-2 text-sm ${isActive? 'text-white bg-gray-700':'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                                    Following
                                                </NavLink>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 justify-self-end">
                        {/* Mobile menu button (visible on small screens) */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                aria-controls="mobile-menu"
                                aria-expanded={mobileOpen}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileOpen ? (
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div className="hidden md:flex items-center space-x-2">
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link to="/search" className="px-2 py-1 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                        Search
                                    </Link>

                                    {/* Subscription button */}
                                    <button
                                        onClick={() => navigate('/subscription')}
                                        className="flex items-center gap-2 text-white px-2 py-1 rounded-md text-sm font-medium hover:text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <img className="w-5" src={assets.credit_star} alt="Subscription" />
                                        <p className="text-xs sm:text-sm font-medium">
                                            {subscription?.hasPremium ? (subscription.status === 'trial' ? 'Trial Active' : 'Premium') : 'Free'}
                                        </p>
                                    </button>

                                    {/* Notification Bell */}
                                    <Link to="/notifications" className="relative px-2 py-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                        <span className="text-xl">🔔</span>
                                        {notificationCount > 0 && (
                                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                {notificationCount > 9 ? '9+' : notificationCount}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Merged profile: avatar/name -> profile link, separate chevron dropdown for actions */}
                                    <Link to={`/profile/${user._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                                        <img
                                            className="h-8 w-8 rounded-full object-cover border border-gray-600"
                                            src={user.profilePicture || assets.profile_icon}
                                            alt="User Avatar"
                                            title="View Profile"
                                            onError={(e) => { e.target.src = assets.profile_icon; }}
                                        />
                                        <span className="text-gray-300 hidden xl:inline">{`Hi, @${user.username || user.email?.split('@')[0] || 'user'}`}</span>
                                    </Link>

                                    <div className="relative" ref={profileRef}>
                                        <button onClick={() => setProfileOpen(!profileOpen)} className="p-1 rounded-full hover:bg-gray-700">
                                            <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        {profileOpen && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                                <div className="py-1">
                                                    <Link to={`/profile/${user._id}`} onClick={()=>setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">Profile</Link>
                                                    <button onClick={()=>{ setProfileOpen(false); navigate('/subscription'); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">Subscription</button>
                                                    <button onClick={()=>{ setProfileOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">Logout</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : !isLoadingUser ? (
                                // Logged-out state: account dropdown
                                <div className="relative">
                                    <button onClick={() => setProfileOpen(!profileOpen)} className="bg-blue-500 text-white px-4 py-2 rounded-full">Account ▾</button>
                                    {profileOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                                            <div className="py-1">
                                                <button onClick={()=>{ setShowLogin(true); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">Login / Sign in</button>
                                                <button onClick={()=>{ navigate('/buy'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">Pricing</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Loading state
                                <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse"></div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {/* Mobile menu, show/hide based on menu state. */}
            {mobileOpen && (
                <div id="mobile-menu" className="md:hidden bg-gray-900/90 border-t border-gray-800">
                    <div className="px-4 pt-3 pb-3 space-y-1">
                        <NavLink to="/" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                            Home
                        </NavLink>
                        <NavLink to="/books" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                            Books
                        </NavLink>
                        {user && (
                            <NavLink to="/recommendations" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                Recommendations ⭐
                            </NavLink>
                        )}
                        {user && (
                            <NavLink to="/my-lists" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                My Lists ⭐
                            </NavLink>
                        )}
                        <NavLink to="/posts" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                            Posts
                        </NavLink>
                        <NavLink to="/about" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                            About
                        </NavLink>
                        {user && (
                            <NavLink to="/friends" onClick={()=>setMobileOpen(false)} className={({isActive})=>`block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}>
                                Following
                            </NavLink>
                        )}
                    </div>

                    <div className="border-t border-gray-800 px-4 py-3">
                        {user ? (
                            <div className="space-y-2">
                                <button onClick={()=>{ setMobileOpen(false); navigate('/search'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700">Search</button>
                                <button onClick={()=>{ setMobileOpen(false); navigate('/subscription'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700">{subscription?.hasPremium ? (subscription.status === 'trial' ? 'Trial Active' : 'Premium') : 'Free'}</button>
                                <button onClick={()=>{ setMobileOpen(false); navigate('/notifications'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700">Notifications {notificationCount>0?`(${notificationCount>9?'9+':notificationCount})`:''}</button>
                                <div className="flex items-center justify-between">
                                    <Link to={`/profile/${user._id}`} onClick={()=>setMobileOpen(false)} className="flex items-center gap-2">
                                        <img className="h-8 w-8 rounded-full object-cover" src={assets.profile_icon} alt="User Avatar" />
                                        <span className="text-gray-300">{`@${user.username || user.email?.split('@')[0] || 'user'}`}</span>
                                    </Link>
                                    <button onClick={()=>{ setMobileOpen(false); logout(); }} className="bg-blue-500 text-white px-3 py-2 rounded-md">Logout</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <button onClick={()=>{ setMobileOpen(false); navigate('/buy'); }} className="text-gray-300 hover:text-white">Pricing</button>
                                <button onClick={()=>{ setMobileOpen(false); setShowLogin(true); }} className="bg-blue-500 text-white px-4 py-2 rounded-md">Login</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;