import { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
    const { user, token, isLoadingUser, setShowLogin } = useContext(AppContext);
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoadingUser) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If no token or user, redirect to home and show login modal
    if (!token || !user) {
        // Trigger login modal
        setTimeout(() => setShowLogin(true), 100);
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // User is authenticated, render the protected component
    return children;
};

export default ProtectedRoute;
