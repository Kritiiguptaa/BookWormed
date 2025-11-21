import { createContext, useEffect, useState } from "react";
import axios from 'axios'; 
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
export const AppContext = createContext();

const AppContextProvider = (props) => {
    // Start with user as null to represent a logged-out state
    // const [user,setUser]=useState({ name: 'Demo User', email: 'demo@example.com' });

    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [subscription, setSubscription] = useState(null)
    const [siteStats, setSiteStats] = useState({ posts: 0, reviews: 0, books: 0 })
    const [isLoadingUser, setIsLoadingUser] = useState(!!localStorage.getItem('token'));
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const loadSubscriptionData=async()=>{
        try {
            console.log('Loading subscription data...');
            const {data}=await axios.get(backendUrl + '/api/user/subscription', {headers:{token}})
            console.log('Subscription data response:', data);
            if(data.success){
                console.log('Setting subscription:', data.subscription);
                setSubscription(data.subscription)
            } else {
                console.error('Failed to load subscription data:', data.message);
                // Set empty subscription object to indicate loaded but no premium
                setSubscription({ hasPremium: false, status: 'expired', plan: 'free' });
            }
        } catch (error) {
            console.error('Error loading subscription data:', error)
            console.error('Error response:', error.response?.data);
            // Set empty subscription object to indicate loaded but failed
            setSubscription({ hasPremium: false, status: 'expired', plan: 'free' });
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const loadSiteStats = async () => {
        try {
            console.log('Loading site stats...');
            const { data } = await axios.get(backendUrl + '/api/stats');
            console.log('Site stats response:', data);
            if (data.success && data.stats) {
                setSiteStats({
                    posts: data.stats.posts || 0,
                    reviews: data.stats.reviews || 0,
                    books: data.stats.books || 0
                });
            }
        } catch (error) {
            console.error('Error loading site stats:', error);
        }
    }

    const fetchUser = async () => {
        const currentToken = token || localStorage.getItem('token');
        if (!currentToken) {
            console.log('No token found, skipping user fetch');
            setIsLoadingUser(false);
            return;
        }

        try {
            setIsLoadingUser(true);
            console.log('Fetching user with token:', currentToken.substring(0, 20) + '...');
            const response = await axios.get(`${backendUrl}/api/user/get`, {
                headers: { token: currentToken }
            });
            console.log('Fetch user response:', response.data);
            if (response.data.success && response.data.user) {
                console.log('Setting user:', response.data.user);
                setUser(response.data.user);
            } else {
                console.error('User fetch failed:', response.data.message);
                // If token is invalid, clear it
                if (response.data.message?.includes('Authorized') || response.data.message?.includes('token')) {
                    logout();
                }
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            console.error("Error response:", error.response?.data);
            // Only logout if it's an auth error
            if (error.response?.status === 401 || error.response?.data?.message?.includes('Authorized')) {
                logout();
            }
        } finally {
            setIsLoadingUser(false);
        }
    };

    // Fetch user data when component mounts or token changes
    useEffect(() => {
        if (token && !user) {
            // Only fetch if we have a token but no user data
            fetchUser();
        } else if (!token) {
            // No token means logged out
            setIsLoadingUser(false);
        } else if (token && user) {
            // We have both token and user, ensure loading is false
            setIsLoadingUser(false);
        }
    }, [token, user]);

    // Load site stats on mount
    useEffect(() => {
        loadSiteStats();
    }, []);

    // Load subscription data when we have a token
    useEffect(() => {
        if (token && user && subscription === null) {
            console.log('Loading subscription for logged-in user...');
            loadSubscriptionData();
        }
    }, [token, user, subscription]);

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
        setSubscription(null);
        setIsLoadingUser(false);
    };
    
    const value = {
        user,
        setUser,
        showLogin,
        setShowLogin,
        backendUrl,
        token,
        setToken,
        logout,
        fetchUser,
        subscription,
        setSubscription,
        loadSubscriptionData,
        siteStats,
        loadSiteStats,
        isLoadingUser
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
export default AppContextProvider;
