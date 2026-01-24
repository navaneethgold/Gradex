import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Home, Award, CheckCircle, XCircle, Slash, Activity } from 'lucide-react';
import '../Styles/analytics.css';

const Analytics = () => {
  const { exam } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [examDetails, setExamDetails] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [questions, setQuestions] = useState([]);
  const [userData, setUserData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [answers, setAnswers] = useState([]);
  const [stats, setStats] = useState({
    score: 0,
    totalMarks: 0,
    obtainedMarks: 0,
    accuracy: 0,
    correctCount: 0,
    wrongCount: 0,
    unattemptedCount: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 1. Fetch Questions for the Exam
        const resQuestions = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${exam}/getQuestions`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resQuestions.data.got) {
          const fetchedQuestions = resQuestions.data.questions;
          const examInfo = resQuestions.data.Nowexam;
          const user = resQuestions.data.puser;

          // 2. Fetch User's Answers
          const resAnswers = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${examInfo.examName}/getAnswers`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          });

          if (resAnswers.data.got) {
            const userAnswers = resAnswers.data.answersq.answersAll;

            let correctCount = 0;
            let obtainedMarks = 0;
            let totalMarks = 0;
            let unattemptedCount = 0;

            fetchedQuestions.forEach((q, i) => {
              totalMarks += q.marks;
              const userAns = userAnswers[i];

              if (!userAns || userAns.trim() === "") {
                unattemptedCount++;
              } else if (userAns.trim().toLowerCase() === q.qAnswer.trim().toLowerCase()) {
                correctCount++;
                obtainedMarks += q.marks;
              }
            });

            const wrongCount = fetchedQuestions.length - correctCount - unattemptedCount;
            const accuracy = (correctCount / fetchedQuestions.length) * 100;

            setQuestions(fetchedQuestions);
            setAnswers(userAnswers);
            setExamDetails(examInfo);
            setUserData(user);
            setStats({
              score: correctCount,
              totalMarks,
              obtainedMarks,
              accuracy: accuracy.toFixed(1),
              correctCount,
              wrongCount,
              unattemptedCount
            });

            // Post Analytics to backend (Idempotent check handled by backend)
            const newAnalytic = {
              examId: examInfo._id,
              examWho: user.username,
              totalQ: fetchedQuestions.length,
              correctQ: correctCount,
              duration: examInfo.duration,
              marks: obtainedMarks,
              unattempted: unattemptedCount,
            };

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/postAnalytics`, { newana: newAnalytic }, {
              withCredentials: true,
            });
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    } else {
      navigate('/login');
    }
  }, [exam, token, navigate]);

  if (loading) return (
    <div className="analytics-loading">
      <div className="loader"></div>
      <p>Analyzing Performance...</p>
    </div>
  );

  // Data for Charts
  const pieData = [
    { name: 'Correct', value: stats.correctCount, color: '#22c55e' },
    { name: 'Wrong', value: stats.wrongCount, color: '#ef4444' },
    { name: 'Skipped', value: stats.unattemptedCount, color: '#94a3b8' },
  ];

  const barData = [
    { name: 'Obtained', marks: stats.obtainedMarks },
    { name: 'Total', marks: stats.totalMarks },
  ];

  return (
    <motion.div
      className="analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="analytics-header">
        <div>
          <h1 className="page-title">
            <Activity className="title-icon" /> Performance Analysis
          </h1>
          <p className="page-subtitle">Detailed insights for <strong>{exam}</strong></p>
        </div>
        <button className="home-btn" onClick={() => navigate('/home')}>
          <Home size={18} /> Back to Home
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="stats-grid">
        <motion.div
          className="stat-card highlight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon-bg"><Award size={32} /></div>
          <div>
            <h3>{stats.obtainedMarks} / {stats.totalMarks}</h3>
            <p>Total Score</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon-bg green"><CheckCircle size={28} /></div>
          <div>
            <h3>{stats.correctCount}</h3>
            <p>Correct</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-icon-bg red"><XCircle size={28} /></div>
          <div>
            <h3>{stats.wrongCount}</h3>
            <p>Incorrect</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-icon-bg gray"><Slash size={28} /></div>
          <div>
            <h3>{stats.unattemptedCount}</h3>
            <p>Skipped</p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Section */}
      <div className="charts-container">

        {/* Accuracy Pie Chart */}
        <motion.div
          className="chart-card"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Accuracy Distribution</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="accuracy-center">
            <h3>{stats.accuracy}%</h3>
            <p>Accuracy</p>
          </div>
        </motion.div>

        {/* Marks Bar Chart */}
        <motion.div
          className="chart-card"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2>Score Overview</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  cursor={{ fill: 'var(--hover-bg)' }}
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="marks" fill="var(--accent-color)" radius={[8, 8, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* User Info Footer or Summary */}
      <div className="analytics-footer">
        <p>Candidate: <strong>{userData?.username || 'User'}</strong> | Exam ID: {examDetails?._id || 'N/A'}</p>
      </div>

    </motion.div>
  );
};

export default Analytics;
