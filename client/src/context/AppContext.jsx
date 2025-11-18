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
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const loadCreditData=async()=>{
        try {
            const {data}=await axios.get(backendUrl + '/api/user/credits', {headers:{token}})
            if(data.success){
                setCredit(data.credits)
                setUser(data.user)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            
        }
    }

    const fetchUser = async () => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            try {
                // This endpoint needs to be created on the backend
                const response = await axios.get(`${backendUrl}/api/user/get`, {
                    headers: { token: currentToken }
                });
                console.log('Fetch user response:', response.data);
                if (response.data.success) {
                    console.log('Setting user:', response.data.user);
                    setUser(response.data.user); // Update state with fresh user data
                } else {
                    // Handle cases where token might be invalid
                    console.error('User fetch failed:', response.data.message);
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
    useEffect(()=>{
        if(token){
            loadCreditData()
        }
    },[token])
    
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
        loadCreditData
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
export default AppContextProvider;
