import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "../Styles/geminiAI.css";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NumbersIcon from '@mui/icons-material/Numbers';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import Flash from "./flash";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

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
  const [classMaterials, setClassMaterials] = useState([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}/materials`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.fetched) {
          setClassMaterials(res.data.materials);
        }
      } catch (err) {
        console.error("Failed to fetch class materials:", err);
      }
    };
    if (examId) fetchMaterials();
  }, [examId, token]);

  const handleMaterialToggle = (material) => {
    let matKey = material.objectKey || material.file; // Fallback if objectKey is missing
    console.log("matKey", matKey);
    matKey = `s3://${import.meta.env.VITE_BUCKET_NAME}/${matKey}`
    console.log("matKey", matKey);
    if (selectedMaterialIds.includes(matKey)) {
      setSelectedMaterialIds(prev => prev.filter(id => id !== matKey));
    } else {
      setSelectedMaterialIds(prev => [...prev, matKey]);
    }
  };
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token])

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
        portions,
        selectedMaterialIds
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("res", res);
      const questions = res.data.allAiQuestions;
      console.log("questions", questions);
      for (const eachobj of questions) {
        const questionPayload = {
          examName: examId,
          ...eachobj,
          marks: Number(maxMarks) / Number(noQuestions)
        };
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/exams/${examId}/questions`, { payload: questionPayload }, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
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

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="gemini-page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="gemini-header" variants={itemVariants}>
        <h2><AutoAwesomeIcon fontSize="large" sx={{ color: '#2563eb' }} /> AI Generator</h2>
        <p className="gemini-description">
          Define the parameters below and GradeX AI will automatically generate a custom exam for you based on the syllabus provided.
        </p>
      </motion.div>

      {show && <Flash message={flashMessage} type={type} show={show} setShow={setshow} />}

      <motion.div className="ai-config-grid" variants={itemVariants}>
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
      </motion.div>

      <div className="content-split-layout">
        <motion.div className="prompt-section" variants={itemVariants}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            <DescriptionIcon fontSize="small" /> Syllabus & Topics
          </label>
          <textarea
            className="prompt-textarea"
            placeholder="Paste the syllabus, chapter summaries, or specific topics you want to cover in this exam..."
            value={portions}
            onChange={(e) => setportions(e.target.value)}
          />
        </motion.div>

        <motion.div className="file-section-container" variants={itemVariants}>
          {classMaterials.length > 0 && (
            <div className="class-materials-section">
              <label className="section-label">
                <FolderOpenIcon fontSize="small" /> Class Materials
              </label>
              <div className="materials-list">
                {classMaterials.map((mat, idx) => {
                  const isSelected = selectedMaterialIds.includes(`s3://${import.meta.env.VITE_BUCKET_NAME}/${mat.objectKey || mat.file}`);
                  return (
                    <div
                      key={idx}
                      className={`material-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleMaterialToggle(mat)}
                    >
                      <input
                        type="checkbox"
                        className="material-checkbox"
                        checked={isSelected}
                        onChange={() => { }} /* Handled by parent div click */
                      />
                      <div className="material-info">
                        <span className="material-title" title={mat.title}>{mat.title}</span>
                        <span className="material-group">
                          From: {mat.groupName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="section-label">
            <CloudUploadIcon fontSize="small" /> Upload Secret Materials (These materials won't be visible in Class Materials but considered for generating exam questions)
          </label>
          <div className="file-upload-box">
            <input type="file" multiple onChange={handleFileChange} id="file-upload" className="file-input-hidden" />
            <label htmlFor="file-upload" className="file-drop-area">
              <CloudUploadIcon fontSize="large" style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
              <span>Click to select files</span>
            </label>
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                className="selected-files-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4>Selected Files ({files.length})</h4>
                <ul>
                  {files.map((file, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <div className="file-info-chip">
                        <InsertDriveFileIcon fontSize="small" />
                        <span className="file-name">{file.name}</span>
                      </div>
                      <button className="btn-remove-file" onClick={() => handleRemoveFile(index)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </button>
                    </motion.li>
                  ))}
                </ul>
                <button className="btn-upload-confirm" onClick={handleUpload}>
                  Upload Selected Files
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div className="ai-actions" variants={itemVariants}>
        <button className="btn-generate-ai" onClick={handleAIgen} disabled={loading}>
          {loading ? <div className="loading-spinner"></div> : <AutoAwesomeIcon />}
          {loading ? "Generating..." : "Generate Exam with AI"}
        </button>
      </motion.div>
    </motion.div>
  );
}
export default GeminiAI;