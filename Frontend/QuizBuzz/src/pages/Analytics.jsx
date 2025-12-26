import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import '../Styles/analytics.css';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HomeIcon from '@mui/icons-material/Home';

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
        // 1. Fetch Questions for the Exam
        const resQuestions = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${exam}/getQuestions`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resQuestions.data.got) {
          const fetchedQuestions = resQuestions.data.questions; // Likely sorted by questionNo
          const examInfo = resQuestions.data.Nowexam;
          const user = resQuestions.data.puser;

          // 2. Fetch User's Answers
          const resAnswers = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${examInfo.examName}/getAnswers`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          });

          if (resAnswers.data.got) {
            // answersAll is an array of answers. 
            // Assuming index 0 matches Question 1, index 1 matches Question 2, etc.
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
    return <div className="analytics-page-container" style={{ justifyContent: 'center', alignItems: 'center' }}><h2>Loading Analytics...</h2></div>;
  }

  if (!examDetails || !userData) {
    return <div className="analytics-page-container"><h2>Error loading analytics data.</h2></div>;
  }

  const percentage = (stats.obtainedMarks / stats.totalMarks) * 100;

  return (
    <div className="analytics-page-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-info">
          <h1><AssessmentIcon fontSize="large" sx={{ color: '#3b82f6' }} /> Exam Results</h1>
          <p><strong>{examDetails.examName}</strong> • Candidate: {userData.username}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate(`/${examDetails._id}/analytics/leaderboard`)}>
            <LeaderboardIcon /> Leaderboard
          </button>
          <button onClick={() => navigate('/home')} style={{ background: '#64748b' }}>
            <HomeIcon /> Home
          </button>
        </div>
      </div>

      <div className="analytics-dashboard">
        {/* Score Card */}
        <div className="score-card">
          <div className="score-circle" style={{ background: `conic-gradient(#3b82f6 ${percentage}%, #e2e8f0 ${percentage}%)` }}>
            <div className="score-value">{Math.round(percentage)}%</div>
          </div>
          <div className="score-label">Score: {stats.obtainedMarks} / {stats.totalMarks}</div>
          <p style={{ color: percentage >= 50 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            {percentage >= 50 ? "Excellent Work!" : "Need Improvement"}
          </p>
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
      </div>

      {/* Question Analysis */}
      <div className="analysis-section">
        <h2>Question Analysis</h2>
        <div className="question-review-list">
          {questions.map((q, idx) => {
            const userAns = answers[idx];
            const isCorrect = userAns && userAns.trim().toLowerCase() === q.qAnswer.trim().toLowerCase();
            const isUnattempted = !userAns || userAns.trim() === "";

            let statusClass = "wrong";
            let statusText = "Wrong";
            if (isCorrect) { statusClass = "correct"; statusText = "Correct"; }
            else if (isUnattempted) { statusClass = "unattempted"; statusText = "Not Attempted"; }

            return (
              <div key={q._id} className="review-item">
                <div className="review-header">
                  <span className="q-number">Question {q.questionNo}</span>
                  <span className={`q-status ${statusClass}`}>{statusText}</span>
                </div>
                <div className="review-question">{q.question}</div>
                <div className="review-answers">
                  <div className="ans-block">
                    <span className="ans-label">Your Answer</span>
                    <span className={`ans-text ${isCorrect ? 'correct' : 'user-wrong'}`}>
                      {isUnattempted ? "-" : userAns}
                    </span>
                  </div>
                  <div className="ans-block">
                    <span className="ans-label">Correct Answer</span>
                    <span className="ans-text correct">{q.qAnswer}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
