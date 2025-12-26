import { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Flash from "./flash";
import "../Styles/profile.css";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';

const Profile = () => {
  const token = localStorage.getItem("token");
  const [userData, setUserData] = useState({});
  const [allExams, setAllExams] = useState([]);
  const [grpNames, setgrpNames] = useState({});
  const [isLogged, setisLogged] = useState(false);
  const navigate = useNavigate();

  const getProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/getProfile`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.got) {
        setUserData(res.data.profile);
        setisLogged(true);
        const res2 = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/home/getExams/${res.data.profile.username}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res2.data.gotExams) {
          setAllExams(res2.data.exams);
          setgrpNames(res2.data.grpNames);
        }
      }
    } catch (error) {
      console.error("Error fetching profile", error);
      navigate('/login');
    }
  }

  useEffect(() => {
    getProfile();
  }, []);

  const startExam = async (name) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/${name}/setEnd`, {}, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate(`/start-exam/${name}`);
    } catch (error) {
      console.error("Error starting exam", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setisLogged(false);
    setUserData({});
    setAllExams([]);
    setgrpNames({});
    navigate("/login");
  }

  return (
    <div className="profile-page-container">
      {/* User Header Section */}
      <div className="profile-header-card">
        <div className="user-info-wrapper">
          <div className="user-avatar-placeholder">
            <AccountCircleIcon style={{ fontSize: 'inherit' }} />
          </div>
          <div className="user-details">
            <h2>{userData.username || 'User'}</h2>
            <div className="user-meta">
              <span><EmailIcon fontSize="small" /> {userData.email}</span>
              {/* Can add more details here later */}
            </div>
          </div>
        </div>

        {isLogged && (
          <button onClick={handleLogout} className="btn-logout">
            <LogoutIcon fontSize="small" /> Logout
          </button>
        )}
      </div>

      {/* Exams Grid Section */}
      <div>
        <h2 className="exams-section-title">Your Exams</h2>
        <div className="exams-grid">
          {allExams.length > 0 ? (
            allExams.map((exam) => (
              <div className="exam-card" key={exam._id}>
                <div className="exam-header">
                  <h3>{exam.examName}</h3>
                </div>

                <div className="exam-details">
                  <p><AccountCircleIcon fontSize="small" style={{ color: '#94a3b8' }} /> Created by: {exam.createdBy}</p>
                  <p><GroupsIcon fontSize="small" style={{ color: '#94a3b8' }} /> Groups: {exam.groups.map((grp) => grpNames[grp] || grp).join(", ")}</p>
                  <p><AccessTimeIcon fontSize="small" style={{ color: '#94a3b8' }} /> Duration: {exam.duration} mins</p>
                </div>

                <div className="exam-footer">
                  {!exam.submitted.includes(userData.userId) ? (
                    <button className="exam-btn btn-start" onClick={() => startExam(exam._id)}>
                      <PlayArrowIcon /> {exam.endTime.includes(userData.username) ? "Resume Exam" : "Start Exam"}
                    </button>
                  ) : (
                    <div className="completed-actions">
                      <button className="exam-btn btn-completed">
                        <CheckCircleIcon fontSize="small" /> Completed
                      </button>
                      <button className="exam-btn btn-analytics" onClick={() => navigate(`/${exam._id}/analytics`)}>
                        <EqualizerIcon fontSize="small" /> Analytics
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-exams">
              <p>No exams have been assigned to you yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;