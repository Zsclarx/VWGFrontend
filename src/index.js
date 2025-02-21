import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import LoginPage from './Login';  
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';  
import reportWebVitals from './reportWebVitals';

const Root = () => {
  const navigate = useNavigate();
  
  // Clear all data in localStorage when app starts
  useEffect(() => {
    localStorage.clear(); // Clear all stored data
    console.log('localStorage cleared');
  }, []);

  // Manage login state using localStorage for token persistence
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Navigate to the appropriate page based on whether the user is logged in or not
    if (token) {
      navigate('/');  // Redirect to home if logged in
    } else {
      navigate('/login');  // Redirect to login if not logged in
    }
  }, [token, navigate]);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);  // Store token in localStorage
    setToken(token);  // Update the state with the new token
    navigate('/');  // Redirect to the main app after successful login
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/" element={token ? <App /> : <LoginPage onLogin={handleLogin} />} />
    </Routes>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
