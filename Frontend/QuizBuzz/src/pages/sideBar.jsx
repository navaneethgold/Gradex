import { Link, useNavigate, useLocation } from "react-router-dom";
import "../Styles/sideBar.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { Home, FilePlus, ClipboardList, User, Settings } from 'lucide-react';
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogged, setisLogged] = useState(false);
  const [userData, setuserData] = useState({});
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setisLogged(false);
        setflashMessage("No token found. Please log in.");
        setistype("error");
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-login`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.isLoggedIn) {
          setisLogged(true);
          setuserData(res.data.user);
          console.log(res.data.user);
          setflashMessage(res.data.message);
          setistype(res.data.type || "success");
        } else {
          setisLogged(false);
          setflashMessage("Not logged in");
          setistype("error");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setisLogged(false);
        setflashMessage("Not logged in");
        setistype("error");
      }
      return;
    }
    checkAuth();
  }, [isLogged])
  const hhome = () => {
    navigate("/home")
  }
  const hnewexam = () => {
    navigate("/create-exam");
  }
  const groups = () => {
    navigate("/groups")
  }
  const hprofile = () => {
    navigate("/profile")
  }
  const signup = () => {
    navigate("/signUp");
  }
  const logins = () => {
    navigate("/login");
  }
  const settings = () => {
    navigate("/settings");
  }

  return (
    <>
      <div className="head">
        {isLogged ? (
          <div className='head2'>
            <h2>Welcome, {userData.username}!</h2>
          </div>
        ) : (
          <div className='sl'>
            <div className='log' onClick={signup}>Signup/</div>
            <div className='log' onClick={logins}>Login</div>
          </div>
        )}
      </div>
      <div className="sidebar">
        <div className="icon" onClick={hhome}>
          <div className="ic"><img src="/icon.png" alt="icon" className="icon2" /></div>
          <div id="txt"><h3 id="txt2">QuizBuzz</h3></div>
        </div>

        <div className={`nav-item home ${location.pathname === '/home' ? 'active' : ''}`} onClick={hhome}>
          <div className="icones"><Home size={22} /></div>
          <div className="labeles">
            <h4>Home</h4>
          </div>
        </div>

        <div className={`nav-item newexam ${location.pathname === '/create-exam' ? 'active' : ''}`} onClick={hnewexam}>
          <div className="icones"><FilePlus size={22} /></div>
          <div className="labeles">
            <h4>New Exam</h4>
          </div>
        </div>

        <div className={`nav-item newtask ${location.pathname === '/groups' ? 'active' : ''}`} onClick={groups}>
          <div className="icones"><ClipboardList size={22} /></div>
          <div className="labeles">
            <h4>Groups</h4>
          </div>
        </div>

        <div className={`nav-item profile ${location.pathname === '/profile' ? 'active' : ''}`} onClick={hprofile}>
          <div className="icones"><User size={22} /></div>
          <div className="labeles">
            <h4>Profile</h4>
          </div>
        </div>

        <div className={`nav-item settings ${location.pathname === '/settings' ? 'active' : ''}`} onClick={settings}>
          <div className="icones"><Settings size={22} /></div>
          <div className="labeles">
            <h4>Settings</h4>
          </div>
        </div>
        {/* </div> */}


      </div>
    </>
  );
}