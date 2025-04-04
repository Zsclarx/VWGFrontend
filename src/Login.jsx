import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Image from "./bgImage.png";
import Logo from "./LoginPageLogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import "./login.css"

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    role: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://vwgbackend.onrender.com/login", {
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://vwgbackend.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok) {
        alert("User registered successfully");
        // Automatically log in after registration
        try {
          const loginResponse = await fetch("https://vwgbackend.onrender.com/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
          });
          const loginResult = await loginResponse.json();
          if (loginResponse.ok) {
            localStorage.setItem('token', loginResult.token);
            onLogin(loginResult.token);
            navigate('/');
          } else {
            alert(loginResult.message || 'Login failed after registration');
          }
        } catch (error) {
          console.error("Error during automatic login:", error);
          alert("An error occurred during automatic login");
        }
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
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Brand</option>
                <option value="VW PC">VW PC</option>
                <option value="AUDI">AUDI</option>
                <option value="SEAT">SEAT</option>
                <option value="SKODA">SKODA</option>
                <option value="CV">CV</option>
              </select>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Role</option>
                <option value="HEAD OF PRODUCT PLANNING">HEAD OF PRODUCT PLANNING</option>
                <option value="PRODUCT MARKETING MANAGER">PRODUCT MARKETING MANAGER</option>
                <option value="PRODUCT MANAGER">PRODUCT MANAGER</option>
                <option value="PRODUCT SUPPORT MANAGER">PRODUCT SUPPORT MANAGER</option>
                <option value="PRODUCT ANALYST">PRODUCT ANALYST</option>
              </select>
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