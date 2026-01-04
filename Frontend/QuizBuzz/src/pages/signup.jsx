import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import "../Styles/signup.css";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Strength State
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");

  const calculateStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: "" };

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "Weak";
    if (score >= 4) label = "Strong";
    else if (score >= 3) label = "Medium";

    return { score, label };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "password") {
      const { score, label } = calculateStrength(value);
      setStrengthScore(score);
      setStrengthLabel(label);
    }
  };

  const getStrengthColor = () => {
    if (strengthScore >= 4) return "#22c55e"; // Green
    if (strengthScore === 3) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (strengthScore < 4) {
      setError("Password is too weak. Must include 8+ chars, uppercase, number, and special char.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/signUp`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true
      });

      if (res.data.err) {
        setError(res.data.err); // user already exists
        return;
      }

      const res2 = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        username: formData.username,
        password: formData.password
      }, {
        withCredentials: true
      });
      localStorage.setItem("token", res2.data.token);
      setflashMessage(res.data.message);
      setistype("success");
      setError(""); // Clear any previous error
      setShow(true);

      setTimeout(() => {
        navigate("/home")
      }, 3000);
    } catch (error) {
      console.error(error);
      setError("Signup failed due to a server error.");
      const errorMessage = error.response?.data?.message || "Login failed";
      setflashMessage(errorMessage);
      setShow(true);
      setistype("error");
    }
  };

  return (
    <div className="signup-container">
      {/* Left Side (Image & Branding) */}
      <div className="signup-left">
        <div className="signup-branding">
          <h1 className="brand-tagline">Join the<br />Community</h1>
          <p className="brand-desc">Create your account to start generating exams, tracking your progress, and challenging your peers today.</p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="signup-right">
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="signup-header">
            <h2>Create Account 🚀</h2>
            <p>Sign up now and get started</p>
          </div>

          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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

          {/* Strength Meter UI */}
          {formData.password && (
            <div className="strength-meter-container">
              <div className="strength-bar-bg">
                <div
                  className="strength-bar-fill"
                  style={{
                    width: `${(strengthScore / 4) * 100}%`,
                    backgroundColor: getStrengthColor()
                  }}
                ></div>
              </div>
              <p style={{ color: getStrengthColor(), fontSize: "0.85rem", marginTop: "0.5rem", textAlign: "right", fontWeight: "600" }}>
                {strengthLabel}
              </p>
            </div>
          )}

          <div className="input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="signup-button">Register</button>

          {show && <Flash message={flashMessage} type={type} show={show} setShow={setShow} />}

          <p className="signup-text">
            Already have an account? <span onClick={() => navigate("/login")} className="signup-link">Login</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
