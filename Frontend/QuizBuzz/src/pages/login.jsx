import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import "../Styles/login.css";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const navigate = useNavigate();
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, formData, {
        withCredentials: true
      });
      localStorage.setItem("token", res.data.token);
      setflashMessage(res.data.message);
      setistype("success");
      setShow(true);
      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || "Login failed";
      setflashMessage(errorMessage);
      setShow(true);
      setistype("error");
    }
  };

  return (
    <div className="login-container">
      {/* Left Side (Image & Branding) */}
      <div className="login-left">
        <div className="login-branding">
          <h1 className="brand-tagline">GradeX</h1>
          <p className="brand-desc">Join our smart quiz platform to test your skills, compete with others, and learn faster using AI-generated exams.</p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="login-right">
        <form onSubmit={handleSubmit} className="login-card">
          <div className="login-header">
            <h2>Welcome Back 👋</h2>
            <p>Please enter your details to sign in</p>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </button>
          </div>

          <button type="submit" className="login-button">Sign In</button>

          {show && <Flash message={flashMessage} type={type} show={show} setShow={setShow} />}

          <p className="signup-text">
            Don't have an account? <span onClick={() => navigate("/signUp")} className="signup-link">Sign up</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
