import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../Styles/StartExam.css";
import ToastManager, { notify } from "../components/ToastManager";

// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ExamStart = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [examDetails, setExamDetails] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({ id: name });
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [totalMarks, settotalMarks] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify.error("Authentication required. Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    const getQuestions = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${name}/questions`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.got) {
          console.log("Start Exam: ", res.data.questions);
          setQuestions(res.data.questions);
          setExamDetails(res.data.Nowexam);
          let marks = 0;
          for (const ques of res.data.questions) {
            marks = marks + ques.marks;
          }
          settotalMarks(marks);

          let duration = res.data.Nowexam.duration;
          if (!duration || isNaN(duration)) {
            console.warn("Invalid duration, defaulting to 10 mins");
            duration = 10;
          }

          const durationSec = duration * 60;

          let endTime = res.data.Nowexam.endTime
            ? new Date(res.data.Nowexam.endTime).getTime()
            : Date.now() + durationSec * 1000;

          // If server time is invalid for some reason, fallback
          if (isNaN(endTime)) {
            endTime = Date.now() + durationSec * 1000;
          }

          const timeRemaining = Math.floor((endTime - Date.now()) / 1000);

          console.log(`Exam Duration: ${duration} mins (${durationSec} secs)`);
          console.log(`Exam End Time (raw): ${res.data.Nowexam.endTime}`);
          console.log(`Calculated End Time: ${new Date(endTime).toLocaleString()}`);
          console.log(`Current Time: ${new Date(Date.now()).toLocaleString()}`);
          console.log(`Time Remaining: ${timeRemaining} seconds`);

          if (timeRemaining <= 0) {
            notify.warning("Exam time has expired.");
            setTimeout(() => navigate("/home"), 2000);
            return;
          }

          setTimeLeft(timeRemaining);
          notify.success(`Exam Started: ${res.data.Nowexam.examName}`);
        } else {
          notify.error("Failed to load exam data.");
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || "Error Loading Exam";
        notify.error(errMsg);
      }
    };
    getQuestions();

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure? Your answers will be lost.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [name, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (questionNo, value) => {
    setAnswers((prev) => ({ ...prev, [questionNo]: value }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    const token = localStorage.getItem("token");

    try {
      console.log(answers);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${name}/submit`, { answers }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.sub) {
        const res2 = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${name}/finish`, {}, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res2.data.sub) {
          notify.success("Exam submitted successfully!");
          setTimeout(() => navigate("/home"), 1500);
        }
      }
    } catch (err) {
      console.error(err);
      notify.error("Error submitting exam. Please try again.");
      setSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!questions.length || !examDetails) return (
    <div className="start-loading-container">
      <ToastManager />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <h2>Loading Your Exam...</h2>
      </motion.div>
    </div>
  );

  const currentQ = questions[currentIndex];

  // Calculate urgency threshold (20% of total duration)
  const durationInMins = examDetails.duration || 10;
  const isUrgent = timeLeft && timeLeft < (durationInMins * 60 * 0.2);

  return (
    <div className="start-exam-container">
      <ToastManager />

      {/* Sticky Header */}
      <motion.div
        className="start-exam-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="start-exam-title">
          <h2>{examDetails.examName}</h2>
        </div>
        <div className="start-exam-stats">
          <div className="start-stat-item">
            <AssignmentIcon fontSize="small" />
            <span>Marks: <strong>{totalMarks}</strong></span>
          </div>
          <div className={`start-stat-item timer ${isUrgent ? 'urgent' : ''}`}>
            <AccessTimeIcon fontSize="small" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="start-exam-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="start-question-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="start-question-header">
              <span className="start-question-badge">Question {currentIndex + 1} of {questions.length}</span>
              <span className="start-question-marks">{currentQ.marks} Marks</span>
            </div>

            <div className="start-question-text">
              <h3>{currentQ.question}</h3>
            </div>

            {/* Question Type: MCQ */}
            {currentQ.questionsType === "MCQ" && (
              <div className="start-options-list">
                {currentQ.additional.map((opt, i) => (
                  <div
                    key={i}
                    className={`start-option-item ${answers[currentQ.questionNo] === opt ? 'selected' : ''}`}
                    onClick={() => handleAnswerChange(currentQ.questionNo, opt)}
                  >
                    <div className="start-option-radio"></div>
                    <span className="start-option-text">{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Question Type: True/False */}
            {currentQ.questionsType === "TrueFalse" && (
              <div className="start-options-list">
                {["True", "False"].map((val) => (
                  <div
                    key={val}
                    className={`start-option-item ${answers[currentQ.questionNo] === val ? 'selected' : ''}`}
                    onClick={() => handleAnswerChange(currentQ.questionNo, val)}
                  >
                    <div className="start-option-radio"></div>
                    <span className="start-option-text">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Question Type: Fill in the Blank */}
            {currentQ.questionsType === "FillBlank" && (
              <div className="start-input-area">
                <textarea
                  className="start-text-answer-input"
                  placeholder="Type your answer here..."
                  value={answers[currentQ.questionNo] || ""}
                  onChange={(e) => handleAnswerChange(currentQ.questionNo, e.target.value)}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Footer */}
      <motion.div
        className="start-exam-footer"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="start-nav-controls">
          {!examDetails.linearity && (
            <button className="start-btn-nav" disabled={currentIndex === 0} onClick={handlePrev}>
              <ArrowBackIcon fontSize="small" /> Previous
            </button>
          )}
        </div>

        <div className="start-nav-controls">
          {currentIndex < questions.length - 1 ? (
            <button className="start-btn-nav" onClick={handleNext}>
              Next <ArrowForwardIcon fontSize="small" />
            </button>
          ) : (
            <button className="start-btn-submit" onClick={handleSubmit} disabled={submitted}>
              <CheckCircleOutlineIcon fontSize="small" /> {submitted ? "Submitted" : "Submit Exam"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ExamStart;