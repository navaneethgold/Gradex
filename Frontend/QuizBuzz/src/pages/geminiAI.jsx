import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/geminiAI.css";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NumbersIcon from '@mui/icons-material/Numbers';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import Flash from "./flash";

const GeminiAI = () => {
  const { un, exam } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [difficult, setdifficulty] = useState("Medium");
  const [maxMarks, setmaxMarks] = useState('');
  const [noQuestions, setnoQuestions] = useState('');
  const [typeQuestions, settypeQuestions] = useState("MCQ");
  const [portions, setportions] = useState("");
  const [flashMessage, setflashMessage] = useState("");
  const [type, setisType] = useState("");
  const [show, setshow] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleAIgen = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/generate-AI-questions`, {
        difficult,
        maxMarks,
        noQuestions,
        typeQuestions,
        portions
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      const questions = res.data.allAiQuestions;
      console.log("Type of allAiQuestions:", typeof res.data.allAiQuestions);

      console.log(questions);
      console.log("Type of allAiQuestions:", typeof questions);
      for (const eachobj of questions) {
        const questionPayload = {
          examName: exam,
          ...eachobj,
          marks: Number(maxMarks) / Number(noQuestions)
        };
        console.log(questionPayload);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam/${exam}/create-question`, { payload: questionPayload }, {
          withCredentials: true
        });
      }
      setshow(true);
      console.log("Questions generated and added successfully!");
      setflashMessage("Questions generated and added successfully!")
      setisType("success");
      setTimeout(() => {
        navigate("/home");
      }, 3000);
    } catch (error) {
      setshow(true);
      console.error("Error during AI generation or question creation:", error);
      // alert("Something went wrong while generating or submitting questions.");
      setflashMessage("Something went wrong while generating or submitting questions.")
      setisType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-page-container">
      <div className="gemini-header">
        <h2><AutoAwesomeIcon fontSize="large" sx={{ color: '#2563eb' }} /> AI Generator</h2>
        <p className="gemini-description">
          Define the parameters below and QuizBuzz AI will automatically generate a custom exam for you based on the syllabus provided.
        </p>
      </div>

      {show && <Flash message={flashMessage} type={type} show={show} setShow={setshow} />}

      <div className="ai-config-grid">
        <div className="config-card">
          <label><EqualizerIcon fontSize="small" /> Difficulty Level</label>
          <select name="difficult" id="difficult" value={difficult} onChange={(e) => setdifficulty(e.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="config-card">
          <label><NumbersIcon fontSize="small" /> Total Marks</label>
          <input type="number" placeholder="e.g. 50" value={maxMarks} onChange={(e) => setmaxMarks(e.target.value)} />
        </div>

        <div className="config-card">
          <label><NumbersIcon fontSize="small" /> Question Count</label>
          <input type="number" placeholder="e.g. 10" value={noQuestions} onChange={(e) => setnoQuestions(e.target.value)} />
        </div>

        <div className="config-card">
          <label><ArticleIcon fontSize="small" /> Question Type</label>
          <select name="typeQuestions" id="typeQuestions" value={typeQuestions} onChange={(e) => settypeQuestions(e.target.value)}>
            <option value="MCQ">MCQ</option>
            <option value="TrueFalse">True/False</option>
            <option value="FillBlank">Fill in the Blank</option>
            <option value="MCQ,TrueFalse,FillBlank">Mixed</option>
          </select>
        </div>
      </div>

      <div className="prompt-section">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#475569' }}>
          <DescriptionIcon fontSize="small" /> Syllabus & Topics
        </label>
        <textarea
          className="prompt-textarea"
          placeholder="Paste the syllabus, chapter summaries, or specific topics you want to cover in this exam..."
          value={portions}
          onChange={(e) => setportions(e.target.value)}
        />
      </div>

      <div className="ai-actions">
        <button className="btn-generate-ai" onClick={handleAIgen} disabled={loading}>
          {loading ? <div className="loading-spinner"></div> : <AutoAwesomeIcon />}
          {loading ? "Generating..." : "Generate Exam"}
        </button>
      </div>
    </div>
  );
}
export default GeminiAI;