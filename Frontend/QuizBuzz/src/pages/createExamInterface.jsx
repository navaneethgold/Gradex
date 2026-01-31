import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../Styles/createExamInterface.css";
import ToastManager, { notify } from "../components/ToastManager";

// Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CreateInterface = () => {
  const { unId, examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [exam, setExam] = useState(null);
  const [savingStatus, setSavingStatus] = useState({}); // Track saving state per question index

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    const fetchExam = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}`, {
          withCredentials: true,
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.data.exam) {
          notify.success("Exam fetched successfully!");
          setExam(response.data.exam);
        }
      } catch (err) {
        console.error(err);
        const errorMessage = err.response?.data?.message || "Failed to fetch exam";
        notify.error(errorMessage);
      }
    };
    fetchExam();
  }, [navigate, examId]);

  function createEmptyQuestion() {
    return {
      questionsType: "MCQ",
      question: "",
      additional: [""],
      qAnswer: "",
      marks: ""
    };
  }

  const handleTypeChange = (index, newType) => {
    const updated = [...questions];
    updated[index].questionsType = newType;
    if (newType !== "MCQ") updated[index].additional = [];
    setQuestions(updated);
  };

  const handleQuestionTextChange = (index, text) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const handleAnswerChange = (index, text) => {
    const updated = [...questions];
    updated[index].qAnswer = text;
    setQuestions(updated);
  }

  const handleMarksChange = (index, text) => {
    const updated = [...questions];
    updated[index].marks = text;
    setQuestions(updated);
  }

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].additional[optIndex] = value;
    setQuestions(updated);
  };

  const addOption = (index) => {
    const updated = [...questions];
    updated[index].additional.push("");
    setQuestions(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].additional = updated[qIndex].additional.filter((_, i) => i !== optIndex);
    setQuestions(updated);
  }

  const deleteQuestion = (index) => {
    if (questions.length === 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  }

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const saveQuestion = async (index) => {
    // Prevent double submission
    if (savingStatus[index]) return;

    const currentQ = questions[index];

    // Validation
    if (!currentQ.question.trim()) {
      notify.error("Question text is required.");
      return;
    }
    if (!currentQ.marks) {
      notify.error("Marks are required.");
      return;
    }
    if (!currentQ.qAnswer.trim()) {
      notify.error("Correct answer is required.");
      return;
    }

    const payload = {
      examName: examId,
      questionNo: index + 1,
      ...questions[index]
    };

    if (questions[index].questionsType === "MCQ") {
      const optionsall = questions[index].additional;
      // Filter out empty options if needed, or validate them
      if (optionsall.some(opt => !opt.trim())) {
        notify.error("All options must be filled.");
        return;
      }

      // Trim spaces for accurate comparison
      const ind = optionsall.map(o => o.trim()).indexOf(questions[index].qAnswer.trim());
      if (ind === -1) {
        notify.error("Answer must match exactly one of the options.");
        return;
      }
    }

    // Set saving status for this specific question
    setSavingStatus(prev => ({ ...prev, [index]: true }));

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam/${examId}/create-question`, { payload }, {
        withCredentials: true
      });
      if (res.data.created) {
        notify.success("Question saved successfully!");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Failed to save question";
      notify.error(errorMessage);
    } finally {
      // Reset saving status after delay or immediately, depending on preference.
      // Immediate reset allows re-save if needed, but the user asked to prevent duplicate saves on multiple clicks.
      // The await above ensures we wait for the request to complete.
      setSavingStatus(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <motion.div
      className="create-interface-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ToastManager />
      <div className="interface-header">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <ArrowBackIcon /> Back
        </button>
        <div className="header-title">
          <h2>Manual Exam Creation</h2>
          <span className="exam-id-badge">{exam ? exam.examName : "Loading..."}</span>
        </div>
        <div className="header-actions">
          <button className="finish-btn" onClick={() => navigate("/home")}>
            <AssignmentTurnedInIcon /> Finish Exam
          </button>
        </div>
      </div>

      <div className="questions-scroll-area">
        <AnimatePresence mode="popLayout">
          {questions.map((q, index) => (
            <motion.div
              className="question-card"
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              layout
            >
              <div className="card-header-row">
                <h3>Question {index + 1}</h3>
                {questions.length > 1 && (
                  <button className="delete-q-btn" onClick={() => deleteQuestion(index)} title="Delete Question">
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group type-select">
                  <label>Question Type</label>
                  <select
                    value={q.questionsType}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TrueFalse">True / False</option>
                    <option value="FillBlank">Fill in the Blank</option>
                  </select>
                </div>

                <div className="form-group marks-input">
                  <label>Marks</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={q.marks}
                    onChange={(e) => handleMarksChange(index, e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Question Text</label>
                <textarea
                  className="question-text-input"
                  placeholder="Type your question here..."
                  value={q.question}
                  onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                />
              </div>

              {q.questionsType === "MCQ" && (
                <div className="mcq-section">
                  <label>Options</label>
                  <div className="options-list">
                    {q.additional.map((opt, optIndex) => (
                      <div key={optIndex} className="option-row">
                        <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                        <input
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                        />
                        <button className="remove-opt-btn" onClick={() => removeOption(index, optIndex)} title="Remove Option">
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="add-opt-btn" onClick={() => addOption(index)}>
                    <AddCircleOutlineIcon fontSize="small" /> Add Option
                  </button>
                </div>
              )}

              <div className="form-group full-width answer-group">
                <label>Correct Answer (Must match correct option strictly)</label>
                <input
                  type="text"
                  className="answer-input"
                  placeholder={q.questionsType === "MCQ" ? "Paste the correct option text here..." : "Type the correct answer"}
                  value={q.qAnswer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </div>

              <div className="card-footer">
                <button
                  className="save-btn"
                  onClick={() => saveQuestion(index)}
                  disabled={savingStatus[index]}
                  style={{ opacity: savingStatus[index] ? 0.7 : 1, cursor: savingStatus[index] ? 'not-allowed' : 'pointer' }}
                >
                  <SaveIcon fontSize="small" /> {savingStatus[index] ? "Saving..." : "Save Question"}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          className="fab-add-btn"
          onClick={addQuestion}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AddCircleOutlineIcon /> Add New Question
        </motion.button>
      </div>
    </motion.div>
  );
};
export default CreateInterface;
