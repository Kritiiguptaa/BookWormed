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
    const [credit,setCredit]=useState(false)
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const loadCreditData=async()=>{
        try {
            console.log('Loading credit data...');
            const {data}=await axios.get(backendUrl + '/api/user/credits', {headers:{token}})
            console.log('Credit data response:', data);
            if(data.success){
                setCredit(data.credits)
                // Also update user data from credit endpoint
                if (data.user && !user) {
                    setUser(data.user);
                }
            } else {
                console.error('Failed to load credit data:', data.message);
            }
        } catch (error) {
            console.error('Error loading credit data:', error)
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const fetchUser = async () => {
        const currentToken = token || localStorage.getItem('token');
        if (!currentToken) {
            console.log('No token found, skipping user fetch');
            setIsLoadingUser(false);
            return;
        }

        if (isLoadingUser) {
            console.log('Already loading user, skipping duplicate request');
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
        // Only fetch if we have a token but no user data
        if (token && !user && !isLoadingUser) {
            fetchUser();
            loadCreditData();
        }
    }, [token]);

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
        setCredit(0);
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
        credit,
        setCredit,
        loadCreditData,
        isLoadingUser
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
export default AppContextProvider;
