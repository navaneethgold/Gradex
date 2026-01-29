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
  Moon,
  ChevronRight,
  ChevronLeft,
  School // Import School icon
} from 'lucide-react';
import "../Styles/sideBar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogged, setIsLogged] = useState(false);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  // Sidebar State
  const [isOpen, setIsOpen] = useState(false);
  const isSidebarOpen = isOpen;

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Navigation Items Configuration
  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "New Exam", path: "/create-exam", icon: FilePlus },
    { label: "Classes", path: "/groups", icon: School }, // Changed to Classes, School icon
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
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
    navigate("/login");
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className={`top-navbar ${isSidebarOpen ? 'shifted' : ''}`}>
        <div className="navbar-left-section">
          {/* Mobile Menu Button (Visible only on mobile) */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Logo in Navbar when Sidebar is Closed (Desktop) or always on Mobile if sidebar closed */}
          {!isSidebarOpen && (
            <div className="navbar-logo" onClick={() => navigate("/home")}>
              <img src="/icon.png" alt="QuizBuzz" className="nav-logo-img" />
              <span className="nav-logo-text">QuizBuzz</span>
            </div>
          )}
        </div>

        <div className="navbar-content">
          <div className="user-actions">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {!loading && (
              isLogged ? (
                <div className="user-info">
                  <span className="welcome-text">Welcome,</span>
                  <span className="username">{userData.username || 'User'}</span>
                  <div className="user-avatar">
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
      <div
        className={`side-navigation ${isSidebarOpen ? 'expanded' : 'collapsed'}`}
      >
        <div className="sidebar-header">
          {/* Logo in Sidebar when Open */}
          {isSidebarOpen && (
            <div
              className="header-content visible"
              onClick={() => navigate("/home")}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div className="logo-container">
                <img src="/icon.png" alt="QuizBuzz Logo" className="logo-img" />
              </div>
              <h1 className="logo-text">QuizBuzz</h1>
            </div>
          )}

          {/* Toggle Button (Menu when closed, Chevron when open) */}
          <button
            className={`sidebar-toggle-btn ${!isSidebarOpen ? 'centered' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft size={28} /> : <Menu size={28} />}
          </button>
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
                title={!isSidebarOpen ? item.label : ''}
              >
                <div className="icon-wrapper">
                  <Icon size={22} className="nav-icon" />
                </div>
                <span className={`nav-label ${isSidebarOpen ? 'visible' : 'hidden'}`}>
                  {item.label}
                </span>
                {isActive && <div className="active-indicator" />}
              </div>
            );
          })}
        </nav>

        {isLogged && (
          <div className="sidebar-footer">
            <div className="nav-item logout" onClick={handleLogout} title="Logout">
              <div className="icon-wrapper">
                <LogOut size={22} className="nav-icon" />
              </div>
              <span className={`nav-label ${isSidebarOpen ? 'visible' : 'hidden'}`}>
                Logout
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close sidebar when clicking outside (Desktop & Mobile) */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
}