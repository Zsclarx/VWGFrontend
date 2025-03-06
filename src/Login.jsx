import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Image from "./bgImage.png";
import Logo from "./LoginPageLogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
// import './Login.css'; // Ensure you have a corresponding CSS file

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        onLogin(result.token);
        navigate('/');
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login");
    }
  };

  // Handle registration form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        alert("User registered successfully");
        setIsRegistering(false); // Switch back to login after registration
        setFormData({ username: '', password: '' }); // Clear form
      } else {
        alert(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("An error occurred during registration");
    }
  };

  return (
    <div className="login-main">
      <div className="login-left">
        <img src={Image} alt="Background" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="Logo" />
          </div>
          <div className="login-center">
            <h2>{isRegistering ? 'Register' : 'Welcome back!'}</h2>
            <p>{isRegistering ? 'Create your account' : 'Please enter your details'}</p>

            <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit}>
              <input 
                type="text" 
                placeholder="Username" 
                name="username"
                value={formData.username} 
                onChange={handleInputChange} 
                required
              />
              <div className="pass-input-div">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  name="password"
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required
                />
                {showPassword ? 
                  <FaEyeSlash onClick={() => setShowPassword(false)} /> : 
                  <FaEye onClick={() => setShowPassword(true)} />
                }
              </div>

              {!isRegistering && (
                <div className="login-center-options">
                  <div className="remember-div">
                    <input type="checkbox" id="remember-checkbox" />
                    <label htmlFor="remember-checkbox">Remember for 30 days</label>
                  </div>
                  <a href="#" className="forgot-pass-link">Forgot password?</a>
                </div>
              )}

              <div className="login-center-buttons">
                <button type="submit">{isRegistering ? 'Register' : 'Log In'}</button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            {isRegistering ? (
              <>
                Already have an account? <a href="#" onClick={() => setIsRegistering(false)}>Log In</a>
              </>
            ) : (
              <>
                Don't have an account? <a href="#" onClick={() => setIsRegistering(true)}>Sign Up</a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;