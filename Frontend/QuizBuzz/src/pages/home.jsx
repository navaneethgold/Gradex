// Updated Home Component with Analytics Summary + Bar Chart + Improvement animations
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "../Styles/home.css";

const COLORS = ["#3b82f6", "#f97316", "#ef4444"]; // Blue, Orange, Red

const Home = () => {
  const [isLogged, setisLogged] = useState(false);
  const [userData, setuserData] = useState({});
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [allExams, setallExams] = useState([]);
  const [grpNames, setgrpNames] = useState({});
  const [allAnalytics, setAllAnalytics] = useState([]);
  const [organised, setOrganised] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = async () => {
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
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.isLoggedIn) {
          setisLogged(true);
          setuserData(res.data.user);
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
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      if (!userData?.username) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/exams/user/${userData.username}`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.gotExams) {
          setallExams(res.data.exams);
          setgrpNames(res.data.grpNames);
          setOrganised(res.data.iorgan);
        }
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };
    fetchExams();
  }, [userData]);

  useEffect(() => {
    const getAllAnalytics = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/all`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.got) {
        setAllAnalytics(res.data.allana);
      }
    };
    getAllAnalytics();
  }, []);

  const startExam = async (name) => {
    await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${name}/start`, {}, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    navigate(`/start-exam/${name}`);
  };

  const totalCorrect = allAnalytics.reduce((acc, curr) => acc + curr.correctQ, 0);
  const totalQuestions = allAnalytics.reduce((acc, curr) => acc + curr.totalQ, 0);
  const totalUnattempted = allAnalytics.reduce((acc, curr) => acc + curr.unattempted, 0);

  const avgAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : 0;
  const avgUnattempted = totalQuestions > 0 ? ((totalUnattempted / totalQuestions) * 100).toFixed(2) : 0;

  const summaryData = [
    { name: "Correct", value: totalCorrect },
    { name: "Unattempted", value: totalUnattempted },
    { name: "Incorrect", value: totalQuestions - totalCorrect - totalUnattempted },
  ];

  const barChartData = allAnalytics.map((entry, idx) => ({
    name: `Exam ${idx + 1}`,
    Accuracy: +((entry.correctQ / entry.totalQ) * 100).toFixed(2),
  }));

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 1 }, // Changed opacity to 1 to guarantee visibility
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="home-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 className="home-exam-heading" variants={itemVariants}>Your Performance Summary</motion.h1>

      {
        allAnalytics.length > 0 ? (
          <motion.div className="home-dashboard-grid" variants={itemVariants}>
            <div className="home-summary-card home-chart-card">
              <h3>Overall Accuracy</h3>
              <div className="home-chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={summaryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      label
                    >
                      {summaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="home-summary-card home-stats-card">
              <h3>Quick Stats</h3>
              <div className="home-stats-grid">
                <div className="home-stat-item">
                  <span className="home-stat-label">Total Questions</span>
                  <span className="home-stat-value">{totalQuestions}</span>
                </div>
                <div className="home-stat-item">
                  <span className="home-stat-label">Total Correct</span>
                  <span className="home-stat-value">{totalCorrect}</span>
                </div>
                <div className="home-stat-item">
                  <span className="home-stat-label">Avg. Accuracy</span>
                  <span className="home-stat-value home-highlight">{avgAccuracy}%</span>
                </div>
              </div>
            </div>

            {barChartData.length > 0 && (
              <div className="home-summary-card home-chart-card home-full-width">
                <h3>Progress Over Time</h3>
                <div className="home-chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" />
                      <YAxis unit="%" stroke="var(--text-secondary)" />
                      <Tooltip
                        cursor={{ fill: 'var(--hover-bg)' }}
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Bar dataKey="Accuracy" fill="var(--accent-color)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div className="home-dashboard-grid" variants={itemVariants}>
            <div className="home-summary-card home-full-width" style={{ textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
              <h3>No Performance Data Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Complete an exam to see your analytics summary here.</p>
            </div>
          </motion.div>
        )
      }

      <motion.h1 className="home-exam-heading" variants={itemVariants}>Available Exams</motion.h1>
      <motion.div className="home-exam-grid" variants={containerVariants}>
        {allExams.filter(exam => exam.createdBy !== userData.username).length > 0 ? (
          allExams.filter(exam => exam.createdBy !== userData.username).map((exam) => (
            <motion.div
              className="home-exam-card"
              key={exam._id}
              variants={itemVariants}
            // whileHover={{ scale: 1.02 }}
            // transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="home-card-header">
                <h2>{exam.examName}</h2>
                <span className="home-badge home-duration">{exam.duration} min</span>
              </div>

              <div className="home-card-body">
                <p><strong>Created by:</strong> {exam.createdBy}</p>
                <p><strong>Groups:</strong> {exam.groups.map((grp) => grpNames[grp] || grp).join(", ")}</p>
                <p className="home-date"><strong>Date:</strong> {new Date(exam.createtime).toLocaleDateString()}</p>
              </div>

              <div className="home-card-footer">
                {!exam.submitted.includes(userData.userId) ? (
                  <button className="home-start-btn" onClick={() => startExam(exam._id)}>
                    {exam.endTime.includes(userData.username) ? "Resume" : "Start Now"}
                  </button>
                ) : (
                  <div className="home-completed-actions">
                    <span className="home-status-completed">Completed</span>
                    <button className="home-view-analytics-btn" onClick={() => navigate(`/${exam._id}/analytics`)}>
                      Analytics
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="home-no-data">No exams assigned to you yet.</p>
        )}
      </motion.div>

      <motion.h1 className="home-exam-heading" variants={itemVariants}>Exams Organised</motion.h1>
      <motion.div className="home-exam-grid" variants={containerVariants}>
        {organised.length > 0 ? (
          organised.map((exam) => (
            <motion.div
              className="home-exam-card"
              key={exam._id}
              variants={itemVariants}
            // whileHover={{ scale: 1.02, translateY: -5 }}
            >
              <div className="home-card-header">
                <h2>{exam.examName}</h2>
                <span className="home-badge home-organiser">Host</span>
              </div>
              <div className="home-card-body">
                <p><strong>Groups:</strong> {exam.groups.map((grp) => grpNames[grp] || grp).join(", ")}</p>
                <p><strong>Duration:</strong> {exam.duration} min</p>
              </div>
              <div className="home-card-footer">
                <button className="home-view-analytics-btn home-full-width" onClick={() => navigate(`/${exam._id}/analytics/leaderboard`)}>
                  Leaderboard
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="home-no-data">You haven't organised any exams yet.</p>
        )}
      </motion.div>
    </motion.div >
  );
};

export default Home;
