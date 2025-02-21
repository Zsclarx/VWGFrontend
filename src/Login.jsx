// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// const Login = ({ onLogin }) => {
  // const [formData, setFormData] = useState({
  //   username: '',
  //   password: ''
  // });
  // const navigate = useNavigate();

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     navigate('/');
  //   }
  // }, [navigate]);

  // const handleFormSubmit = (e) => {
  //   e.preventDefault();

  //   if (formData.username === 'admin' && formData.password === 'password') {
  //     onLogin('dummy-token');
  //     navigate('/');
  //   } else {
  //     alert('Invalid credentials');
  //   }
  // };

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };

//   return (
//     <div className="login-container" style={{ padding: '20px', textAlign: 'center' }}>
//       <h2>Login</h2>
//       <form onSubmit={handleFormSubmit}>
//         <div>
//           <input
//             type="text"
//             name="username"
//             placeholder="Username"
//             value={formData.username}
//             onChange={handleInputChange}
//             style={{ padding: '10px', margin: '5px' }}
//             required
//           />
//         </div>
//         <div>
//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleInputChange}
//             style={{ padding: '10px', margin: '5px' }}
//             required
//           />
//         </div>
//         <div>
//           <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>Login</button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Login;

import React, { useEffect, useState } from "react";
import Image from "./bgImage.png";
import Logo from "./LoginPageLogo.png";
import GoogleSvg from "./GoogleIcon.svg";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [ showPassword, setShowPassword ] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleFormSubmit = (e) => {
    if (formData.username === 'admin' && formData.password === 'password') {
      onLogin('dummy-token');
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
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>

            <form onSubmit={handleFormSubmit}>
              <input type="text" placeholder="Username" value={formData.username} name="username" onChange={handleInputChange} required/>
              <div className="pass-input-div">
                <input type={showPassword ? "text" : "password"} placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} required/>
                {showPassword ? <FaEyeSlash onClick={() => {setShowPassword(!showPassword)}} /> : <FaEye onClick={() => {setShowPassword(!showPassword)}} />}
                
              </div>

              <div className="login-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="remember-checkbox" />
                  <label htmlFor="remember-checkbox">
                    Remember for 30 days
                  </label>
                </div>
                <a href="#" className="forgot-pass-link">
                  Forgot password?
                </a>
              </div>
              <div className="login-center-buttons">
                <button type="submit">Log In</button>
                {/* <button type="button">
                  <img src={GoogleSvg} alt="" />
                  Log In with Google
                </button> */}
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