import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import '../Styles/analytics.css';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HomeIcon from '@mui/icons-material/Home';
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Analytics = () => {
  const { exam } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userData, setUserData] = useState(null);
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
        const resQuestions = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${exam}/getQuestions`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resQuestions.data.got) {
          const fetchedQuestions = resQuestions.data.questions;
          const examInfo = resQuestions.data.Nowexam;
          const user = resQuestions.data.puser;

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

            // Post Analytics to backend
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
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [exam, token]);

  if (loading) {
    return (
      <div className="analytics-page-container center-content">
        <motion.h2 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          Loading Analytics...
        </motion.h2>
      </div>
    );
  }

  if (!examDetails || !userData) {
    return <div className="analytics-page-container center-content"><h2>Error loading analytics data.</h2></div>;
  }

  const percentage = (stats.obtainedMarks / stats.totalMarks) * 100;

  // Chart Data
  const scoreData = [
    { name: 'Correct', value: stats.correctCount, color: '#10b981' },
    { name: 'Wrong', value: stats.wrongCount, color: '#ef4444' },
    { name: 'Unattempted', value: stats.unattemptedCount, color: '#94a3b8' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="analytics-page-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="analytics-header" variants={itemVariants}>
        <div className="header-info">
          <h1><AssessmentIcon fontSize="large" sx={{ color: 'var(--accent-color)' }} /> Exam Results</h1>
          <p><strong>{examDetails.examName}</strong> • {userData.username}</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => navigate(`/${examDetails._id}/analytics/leaderboard`)}>
            <LeaderboardIcon fontSize="small" /> Leaderboard
          </button>
          <button className="secondary-btn" onClick={() => navigate('/home')}>
            <HomeIcon fontSize="small" /> Home
          </button>
        </div>
      </motion.div>

      <motion.div className="analytics-dashboard" variants={itemVariants}>
        {/* Score Card */}
        <div className="score-card">
          <h3>Performance Overview</h3>
          <div className="score-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="score-center-text">
              <span className="percentage">{Math.round(percentage)}%</span>
              <span className="label">Score</span>
            </div>
          </div>
          <div className="score-summary">
            <p className="marks-display">{stats.obtainedMarks} / {stats.totalMarks} Marks</p>
            <p style={{ color: percentage >= 50 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
              {percentage >= 50 ? "Excellent Work!" : "Keep Practicing"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card correct">
            <h4>Correct</h4>
            <p>{stats.correctCount}</p>
          </div>
          <div className="stat-card wrong">
            <h4>Wrong</h4>
            <p>{stats.wrongCount}</p>
          </div>
          <div className="stat-card unattempted">
            <h4>Unattempted</h4>
            <p>{stats.unattemptedCount}</p>
          </div>
          <div className="stat-card time">
            <h4>Accuracy</h4>
            <p>{stats.accuracy}%</p>
          </div>
        </div>
      </motion.div>

      {/* Question Analysis */}
      <motion.div className="analysis-section" variants={itemVariants}>
        <h2>Question Analysis</h2>
        <div className="question-review-list">
          {questions.map((q, idx) => {
            const userAns = answers[idx];
            const isCorrect = userAns && userAns.trim().toLowerCase() === q.qAnswer.trim().toLowerCase();
            const isUnattempted = !userAns || userAns.trim() === "";

            let statusClass = "wrong";
            let statusText = "Wrong";
            if (isCorrect) { statusClass = "correct"; statusText = "Correct"; }
            else if (isUnattempted) { statusClass = "unattempted"; statusText = "Skipped"; }

            return (
              <motion.div
                key={q._id}
                className={`review-item ${statusClass}-border`}
                variants={itemVariants}
              >
                <div className="review-header">
                  <span className="q-number">Question {q.questionNo}</span>
                  <span className={`q-status ${statusClass}`}>{statusText}</span>
                </div>
                <div className="review-question">{q.question}</div>
                <div className="review-answers">
                  <div className={`ans-block ${isCorrect ? 'user-correct-bg' : 'user-wrong-bg'}`}>
                    <span className="ans-label">Your Answer</span>
                    <span className="ans-text">
                      {isUnattempted ? "Not Attempted" : userAns}
                    </span>
                  </div>
                  <div className="ans-block correct-bg">
                    <span className="ans-label">Correct Answer</span>
                    <span className="ans-text">{q.qAnswer}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;