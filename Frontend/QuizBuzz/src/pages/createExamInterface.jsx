import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../Styles/createExamInterface.css";
import Flash from "./flash";
import { useNavigate } from "react-router-dom";

const CreateInterface = () => {
  const { unId, examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [showFlash, setShowFlash] = useState(false);  // global flag

  function createEmptyQuestion() {
    return {
      questionsType: "MCQ",
      question: "",
      additional: [""],
      qAnswer: "",
      marks: ""
    };
  }
  function showFlashMessage(msg, t = "success") {
    setflashMessage(msg);
    setistype(t);
    setShowFlash(true);
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

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const saveQuestion = async (index) => {
    const payload = {
      examName: examId,
      questionNo: index + 1,
      ...questions[index]
    };
    if (questions[index].questionsType === "MCQ") {
      const optionsall = questions[index].additional;
      const ind = optionsall.indexOf(questions[index].qAnswer);
      if (ind === -1) {
        setflashMessage("Answer should exist in options");
        setistype("error");
        setShowFlash(true);
        return;
      }
    }
    console.log(payload);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam/${examId}/create-question`, { payload }, {
        withCredentials: true
      });
      if (res.data.created) {
        showFlashMessage(res.data.message, "success");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Login failed";
      showFlashMessage(errorMessage, "error");
    }
  };

  return (
    <div className="create-interface">
      <h2>Create Exam: {exam}</h2>


      <div className="questions-container">
        {questions.map((q, index) => (
          <div className="question-box2" key={index}>
            <h3>Question {index + 1}</h3>
            <label>Type:</label>
            <select
              value={q.questionsType}
              onChange={(e) => handleTypeChange(index, e.target.value)}
            >
              <option value="MCQ">MCQ</option>
              <option value="TrueFalse">True/False</option>
              <option value="FillBlank">Fill in the Blank</option>
            </select>
            <textarea
              placeholder="Enter question..."
              value={q.question}
              onChange={(e) => handleQuestionTextChange(index, e.target.value)}
            />

            {q.questionsType === "MCQ" && (
              <div className="mcq-options">
                {q.additional.map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                  />
                ))}
                <button type="button" onClick={() => addOption(index)}>Add Option</button>
              </div>
            )}
            <div className="qanswer"><label>Answer:</label><input type="text" placeholder="Type the answer for Evaluation" value={q.qAnswer} onChange={(e) => { handleAnswerChange(index, e.target.value) }} required /></div>
            <div className="marks"><label>Marks:</label><input type="number" placeholder="Marks awarded..." value={q.marks} onChange={(e) => { handleMarksChange(index, e.target.value) }} required /></div>
            <button onClick={() => saveQuestion(index)} className="save-btn">
              Save Question
            </button>
            <Flash message={flashMessage} type={type} show={showFlash} setShow={setShowFlash} />
          </div>
        ))}
        <button onClick={addQuestion} className="add-question-btn">Add Question</button>
      </div>
      <button className="add-question-btn2" onClick={() => navigate("/home")}>Create Exam</button>
    </div>
  );
};

export default CreateInterface;
