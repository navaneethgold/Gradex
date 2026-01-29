import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import '../Styles/createExam.css';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import { motion } from "framer-motion";

const CreateExam = () => {
    const [exam, setexam] = useState("");
    const [allGroups, setAllGroups] = useState([]);
    const [flashMessage, setflashMessage] = useState("");
    const [type, setistype] = useState("");
    const [show, setShow] = useState(false);
    const token = localStorage.getItem("token");
    const [totalTime, setTotalTime] = useState(0);
    const navigate = useNavigate();
    const [checked, setisChecked] = useState([]);
    const [linearity, setlinearity] = useState("Yes");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchGroups = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/groups/getAdmins`, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.fetched) {
                setAllGroups(res.data.allg);
            } else {
                setflashMessage(res.data.message || "Failed to fetch groups.");
                setistype("error");
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            setflashMessage("An error occurred while fetching groups.");
            setistype("error");
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchGroups();
        }
    }, [fetchGroups, token]);

    const handleChecking = (id) => {
        setisChecked((preChecked) => {
            if (preChecked.includes(id)) {
                return preChecked.filter((item) => item !== id);
            } else {
                return [...preChecked, id];
            }
        });
    };

    const handleProceeding = async () => {
        if (checked.length > 0 && exam && totalTime > 0) {
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam`, {
                    groups: checked,
                    examName: exam,
                    duration: totalTime,
                    linear: linearity === "Yes"
                }, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (res.data.message === "success") {
                    const un = res.data.owner;
                    const newExam = res.data.newExam;
                    const unId = un._id;
                    const examId = newExam._id;
                    navigate(`/${unId}/${examId}`);
                }
            } catch (error) {
                console.error("Creation failed", error);
                setflashMessage("Failed to create exam");
                setistype("error");
                setShow(true);
            }
        } else {
            setShow(true);
            setflashMessage("Please select groups, enter exam name, and duration.");
            setistype("error");
        }
    };

    const handleAI = async () => {
        if (checked.length > 0 && exam && totalTime > 0) {
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/create-new-exam`, {
                    groups: checked,
                    examName: exam,
                    duration: totalTime,
                    linear: linearity === "Yes"
                }, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (res.data.message === "success") {
                    const un = res.data.owner;
                    const newExam = res.data.newExam;
                    const unId = un._id;
                    const examId = newExam._id;
                    // Navigate to Gemini AI page using the correct route from App.jsx
                    navigate(`/${unId}/${examId}/AI`);
                }
            } catch (error) {
                console.error("AI Creation failed", error);
                setflashMessage("Failed to initiate AI generation");
                setistype("error");
                setShow(true);
            }
        } else {
            setShow(true);
            setflashMessage("Please select groups, enter exam name, and duration.");
            setistype("error");
        }
    };

    const filteredGroups = allGroups.filter(grp =>
        grp.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 1 }, // Changed opacity to 1 to guarantee visibility
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="create-exam-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {show && <Flash message={flashMessage} type={type} onClose={() => setShow(false)} />}

            <motion.div className="create-exam-header" variants={itemVariants}>
                <h1>Create New Assessment</h1>
                <p>Configure your exam details and select target classes.</p>
            </motion.div>

            <div className="create-exam-layout">
                {/* Left Column: Group Selection */}
                <div className="group-selection-section">
                    <motion.div className="section-title" variants={itemVariants}>
                        <span>Select Classes</span>
                        <input
                            type="text"
                            placeholder="Search classes..."
                            className="search-bar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>

                    <motion.div className="groups-grid" variants={containerVariants}>
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((grp) => {
                                const isSelected = checked.includes(grp._id);
                                return (
                                    <motion.div
                                        key={grp._id}
                                        className={`group-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleChecking(grp._id)}
                                        variants={itemVariants}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="card-header">
                                            <h3>{grp.groupName}</h3>
                                            <div className="check-indicator">
                                                {isSelected && <CheckIcon fontSize="small" />}
                                            </div>
                                        </div>
                                        <div className="card-meta">
                                            <span><strong>Students:</strong> {grp.members ? grp.members.length : 0}</span>
                                            <span><strong>Created:</strong> {new Date(grp.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.p variants={itemVariants} className="no-groups">No classes found matching your search.</motion.p>
                        )}
                    </motion.div>
                </div>

                {/* Right Column: Configuration Panel */}
                <motion.div
                    className="exam-config-section"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                >
                    <h2 className="config-title">Configuration</h2>

                    <div className="config-group">
                        <label>Exam Name</label>
                        <input
                            type="text"
                            className="config-input"
                            placeholder="e.g. Mid-Term Physics"
                            value={exam}
                            onChange={(e) => setexam(e.target.value)}
                        />
                    </div>

                    <div className="config-group">
                        <label>Duration (Minutes)</label>
                        <input
                            type="number"
                            className="config-input"
                            placeholder="e.g. 60"
                            value={totalTime}
                            onChange={(e) => setTotalTime(e.target.value)}
                        />
                    </div>

                    <div className="config-group">
                        <label>Linear Exam?</label>
                        <select
                            className="config-select"
                            value={linearity}
                            onChange={(e) => setlinearity(e.target.value)}
                        >
                            <option value="Yes">Yes (Cannot revisit questions)</option>
                            <option value="No">No (Can revisit questions)</option>
                        </select>
                    </div>

                    <div className="selected-count">
                        {checked.length} Class{checked.length !== 1 ? 'es' : ''} Selected
                    </div>

                    <div className="action-buttons">
                        <button className="btn-ai" onClick={handleAI}>
                            <AutoAwesomeIcon /> Generate with AI
                        </button>
                        <button className="btn-proceed" onClick={handleProceeding}>
                            Create Manually
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default CreateExam;