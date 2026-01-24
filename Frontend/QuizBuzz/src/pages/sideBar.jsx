import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  FilePlus,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import "../Styles/sideBar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogged, setIsLogged] = useState(false);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Navigation Items Configuration
  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "New Exam", path: "/create-exam", icon: FilePlus },
    { label: "Groups", path: "/groups", icon: Users },
    { label: "Profile", path: "/profile", icon: User },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  // Theme Logic
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLogged(false);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-login`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.isLoggedIn) {
          setIsLogged(true);
          setUserData(res.data.user);
        } else {
          setIsLogged(false);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setIsLogged(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [location.pathname]); // Re-check on route change if needed

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
    navigate("/login");
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <div className="navbar-content">
          {/* Logo available in Mobile view or just general branding */}
          <div className="mobile-logo">
            <img src="/icon.png" alt="QuizBuzz" />
            <span>QuizBuzz</span>
          </div>

          <div className="user-actions">
            {/* Theme Toggle Button */}
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            {!loading && (
              isLogged ? (
                <div className="user-info">
                  <span className="welcome-text">Welcome back,</span>
                  <span className="username">{userData.username || 'User'}</span>
                  <div className="user-avatar">
                    {/* Placeholder avatar based on first letter */}
                    {(userData.username || 'U')[0].toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="auth-buttons">
                  <button onClick={() => navigate("/login")} className="btn-login">Login</button>
                  <button onClick={() => navigate("/signUp")} className="btn-signup">Sign Up</button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Side Navigation Bar */}
      <div className="side-navigation">
        <div className="sidebar-header" onClick={() => navigate("/home")}>
          <img src="/icon.png" alt="QuizBuzz Logo" className="logo-img" />
          <h1 className="logo-text">QuizBuzz</h1>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="active-indicator" />}
              </div>
            );
          })}
        </nav>

        {isLogged && (
          <div className="sidebar-footer">
            <div className="nav-item logout" onClick={handleLogout}>
              <LogOut size={20} className="nav-icon" />
              <span className="nav-label">Logout</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}