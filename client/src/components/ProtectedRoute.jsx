import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
    const { user, token, isLoadingUser, setShowLogin } = useContext(AppContext);
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        // If not loading and no authentication, prepare to redirect
        if (!isLoadingUser && (!token || !user)) {
            setShouldRedirect(true);
            // Show login modal after a brief moment
            const timer = setTimeout(() => setShowLogin(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isLoadingUser, token, user, setShowLogin]);

    // Show loading state only during initial authentication check
    if (isLoadingUser && token) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // If no token or user, redirect to home with login prompt
    if (!token || !user || shouldRedirect) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // User is authenticated, render the protected component
    return children;
};

export default ProtectedRoute;
