import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Image from "./bgImage.png";
import Logo from "./LoginPageLogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
// import './Login.css'; // Ensure you have a corresponding CSS file

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.username === 'admin' && formData.password === 'password') {
      const token = 'dummy-token';
      localStorage.setItem('token', token);
      onLogin(token);
      navigate('/');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>

            <form onSubmit={handleFormSubmit}>
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

              <div className="login-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="remember-checkbox" />
                  <label htmlFor="remember-checkbox">Remember for 30 days</label>
                </div>
                <a href="#" className="forgot-pass-link">Forgot password?</a>
              </div>
              <div className="login-center-buttons">
                <button type="submit">Log In</button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <a href="#">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
