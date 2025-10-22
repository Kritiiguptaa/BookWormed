import { createContext, useEffect, useState } from "react";
import axios from 'axios'; 

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
    // Start with user as null to represent a logged-out state
    // const [user,setUser]=useState({ name: 'Demo User', email: 'demo@example.com' });

    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchUser = async () => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            try {
                // This endpoint needs to be created on the backend
                const response = await axios.get(`${backendUrl}/api/user/get`, {
                    headers: { token: currentToken }
                });
                if (response.data.success) {
                    setUser(response.data.user); // Update state with fresh user data
                } else {
                    // Handle cases where token might be invalid
                    logout();
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
                logout(); // Log out if there's an error fetching data
            }
        }
    };

    useEffect(() => {
        fetchUser();
    }, [token]); 

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
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
        fetchUser 
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
export default AppContextProvider;
