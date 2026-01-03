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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
const GeminiAI = () => {
  const { unId, examId } = useParams();
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
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles((preFiles) => [...preFiles, ...e.target.files]);
    }
  };
  const handleRemoveFile = (index) => {
    setFiles((preFiles) => preFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select at least one file");

    // Prepare payload for batch presigned URL generation
    const filesPayload = files.map(f => ({
      fileName: f.name,
      fileType: f.type
    }));

    try {
      console.log("help", filesPayload);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload/presigned-url`, {
        examId: examId,
        files: filesPayload
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const { fileUrls } = res.data;
        alert(`Generated URLs for ${fileUrls.length} files. Starting upload...`);

        // Upload all files in parallel
        await Promise.all(files.map(async (file) => {
          const target = fileUrls.find(u => u.fileName === file.name);
          if (target) {
            await fetch(target.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file
            });
          }
        }));

        alert("All files uploaded successfully!");
        setFiles([]); // Clear selection
      } else {
        alert("Failed to generate upload URLs");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    }
  }


  const handleAIgen = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/generate-AI-questions`, {
        examId: examId,
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
      console.log("questions", questions);
      for (const eachobj of questions) {
        const questionPayload = {
          examName: examId,
          ...eachobj,
          marks: Number(maxMarks) / Number(noQuestions)
        };
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam/${examId}/create-question`, { payload: questionPayload }, {
          withCredentials: true
        });
      }
      setshow(true);
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
      <div className="file-section">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#475569' }}>
          <CloudUploadIcon fontSize="large" /> Materials
        </label>
        <input type="file" multiple onChange={handleFileChange} />
        <button className="btn-upload" onClick={handleUpload}>Upload</button>
      </div>
      {files.length > 0 && <div>
        <h2>Files Selected</h2>
        <ul>
          {files.map((file, index) => {
            return <li key={index}>{file.name}
              <button onClick={() => handleRemoveFile(index)}>Remove</button>
            </li>
          })}
        </ul>
      </div>}

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