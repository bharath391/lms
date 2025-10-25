import React, { useState } from 'react';
import LoginScreen from './pages/LoginScreen';
import AppLayout from './components/layout/AppLayout';
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);

    const handleLogin = (user) => {
        // In a real app, you'd get a JWT token from your backend here
        console.log("Logging in as:", user);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        // In a real app, you'd clear the token
        console.log("Logging out");
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return <AppLayout user={currentUser} onLogout={handleLogout} />;
}