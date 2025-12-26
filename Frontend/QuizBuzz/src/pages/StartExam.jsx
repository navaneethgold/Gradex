import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../Styles/StartExam.css";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const ExamStart = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [questions, setQuestions] = useState([]);
  const [examDetails, setExamDetails] = useState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({ id: name });
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [totalMarks, settotalMarks] = useState(0);

  useEffect(() => {
    const getQuestions = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/${name}/getQuestions`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.got) {
          setQuestions(res.data.questions);
          setExamDetails(res.data.Nowexam);
          let marks = 0;
          for (const ques of res.data.questions) {
            marks = marks + ques.marks;
          }
          settotalMarks(marks);
          const duration = res.data.Nowexam.duration * 60;
          const endTime = res.data.Nowexam.endTime
            ? new Date(res.data.Nowexam.endTime).getTime()
            : Date.now() + duration * 1000;
          const timeRemaining = Math.floor((endTime - Date.now()) / 1000);
          setTimeLeft(timeRemaining);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getQuestions();

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure? Your answers will be lost.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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

    try {
      console.log(answers);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/${name}/submitAnswers`, { answers }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.sub) {
        const res2 = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/${name}/submitted`, {}, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res2.data.sub) {
          alert("Exam submitted successfully!");
        }
      }

      navigate("/home");
    } catch (err) {
      console.error(err);
      alert("Error submitting exam.");
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!questions.length || !examDetails) return (
    <div className="exam-interface" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Loading Exam...</h2>
    </div>
  );

  const currentQ = questions[currentIndex];
  const isUrgent = timeLeft && timeLeft < 60; // Less than 1 minute

  return (
    <div className="exam-page-container">
      {/* Sticky Header */}
      <div className="exam-header">
        <div className="exam-title">
          <h2>{examDetails.examName}</h2>
        </div>
        <div className="exam-stats">
          <div className="stat-item">
            <span>Total Marks:</span>
            <strong>{totalMarks}</strong>
          </div>
          <div className={`stat-item timer ${isUrgent ? 'urgent' : ''}`}>
            <AccessTimeIcon fontSize="small" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="exam-content">
        <div className="question-card">
          <div className="question-header">
            <span className="question-badge">Question {currentIndex + 1} of {questions.length}</span>
            <span className="question-marks">{currentQ.marks} marks</span>
          </div>

          <div className="question-text">
            <h3>{currentQ.question}</h3>
          </div>

          {/* Question Type: MCQ */}
          {currentQ.questionsType === "MCQ" && (
            <div className="options-list">
              {currentQ.additional.map((opt, i) => (
                <div
                  key={i}
                  className={`option-item ${answers[currentQ.questionNo] === opt ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(currentQ.questionNo, opt)}
                >
                  <input
                    type="radio"
                    name={`q${currentQ.questionNo}`}
                    value={opt}
                    checked={answers[currentQ.questionNo] === opt}
                    onChange={() => { }} // Controlled by div click
                    className="option-radio"
                  />
                  <span className="option-text">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question Type: True/False */}
          {currentQ.questionsType === "TrueFalse" && (
            <div className="options-list">
              {["True", "False"].map((val) => (
                <div
                  key={val}
                  className={`option-item ${answers[currentQ.questionNo] === val ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(currentQ.questionNo, val)}
                >
                  <input
                    type="radio"
                    name={`q${currentQ.questionNo}`}
                    value={val}
                    checked={answers[currentQ.questionNo] === val}
                    onChange={() => { }}
                    className="option-radio"
                  />
                  <span className="option-text">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question Type: Fill in the Blank */}
          {currentQ.questionsType === "FillBlank" && (
            <div className="input-area">
              <textarea
                className="text-answer-input"
                placeholder="Type your answer here..."
                value={answers[currentQ.questionNo] || ""}
                onChange={(e) => handleAnswerChange(currentQ.questionNo, e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="exam-footer">
        <div className="nav-controls">
          {!examDetails.linearity && (
            <button className="btn-nav" disabled={currentIndex === 0} onClick={handlePrev}>
              <ArrowBackIcon fontSize="small" /> Previous
            </button>
          )}
        </div>

        <div className="nav-controls">
          {currentIndex < questions.length - 1 ? (
            <button className="btn-nav" onClick={handleNext}>
              Next <ArrowForwardIcon fontSize="small" />
            </button>
          ) : (
            <button className="btn-submit" onClick={handleSubmit}>
              <CheckCircleOutlineIcon fontSize="small" /> Submit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamStart;