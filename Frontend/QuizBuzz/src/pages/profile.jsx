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
import { motion } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 1 }, // Ensure visibility
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="profile-page-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* User Header Section */}
      <motion.div className="profile-header-card" variants={itemVariants}>
        <div className="user-info-wrapper">
          <div className="user-avatar-placeholder">
            <AccountCircleIcon style={{ fontSize: 'inherit' }} />
          </div>
          <div className="user-details">
            <h2>{userData.username || 'User'}</h2>
            <div className="user-meta">
              <span><EmailIcon fontSize="small" /> {userData.email}</span>
            </div>
          </div>
        </div>

        {isLogged && (
          <button onClick={handleLogout} className="btn-logout">
            <LogoutIcon fontSize="small" /> Logout
          </button>
        )}
      </motion.div>

      {/* Exams Grid Section */}
      <motion.div variants={itemVariants}>
        <h2 className="exams-section-title">Your Assignments</h2>

        {allExams.length > 0 ? (
          <motion.div
            className="exams-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {allExams.map((exam) => {
              const isCompleted = exam.submitted?.includes(userData.userId);
              return (
                <motion.div
                  key={exam._id}
                  className="profile-exam-card"
                  variants={itemVariants}
                // whileHover={{ scale: 1.02, y: -4 }}
                // transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="pexam-header">
                    <h3>{exam.examName}</h3>
                    <span className={`status-badge ${isCompleted ? 'completed' : 'pending'}`}>
                      {isCompleted ? <CheckCircleIcon fontSize="small" /> : <AccessTimeIcon fontSize="small" />}
                      {isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="pexam-meta">
                    <div className="meta-item">
                      <GroupsIcon fontSize="small" />
                      <span>{exam.groups?.map((grp) => grpNames[grp] || grp).join(", ") || "No Group"}</span>
                    </div>
                    {isCompleted && (
                      <div className="meta-item highlight">
                        <EqualizerIcon fontSize="small" />
                        <span>{exam.score} Marks</span>
                      </div>
                    )}
                  </div>

                  <div className="pexam-actions">
                    {isCompleted ? (
                      <button
                        className="btn-view-analytics"
                        onClick={() => navigate(`/${exam._id}/analytics`)}
                      >
                        View Results
                      </button>
                    ) : (
                      <button
                        className="btn-start-exam"
                        onClick={() => startExam(exam.examName)}
                      >
                        <PlayArrowIcon /> Start Exam
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="no-exams-state">
            <p>You haven't been assigned any exams yet.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Profile;