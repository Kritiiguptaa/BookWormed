import { useContext } from 'react';
import { assets } from '../assests/assets.js';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
    const { user, setShowLogin, logout } = useContext(AppContext);

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

                                {/* User info */}
                                <div className="flex items-center gap-2">
                                    <img
                                        className="h-8 w-8 rounded-full object-cover"
                                        src={assets.profile_icon}
                                        alt="User Avatar"
                                    />
                                    <span className="text-gray-300 max-sm:hidden">{`Hi, ${user.name}`}</span>
                                </div>
                                
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