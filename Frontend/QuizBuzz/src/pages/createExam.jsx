import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import '../Styles/createExam.css'; // Updated CSS import
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';

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
    const [searchTerm, setSearchTerm] = useState(""); // New search state

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
                    navigate(`/${un}/${exam}`);
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
                    navigate(`/${un}/${exam}/AI`);
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

    // Filter groups based on search
    const filteredGroups = allGroups.filter(grp =>
        grp.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="create-exam-page">
            <div className="create-exam-header">
                <h1>Create New Exam</h1>
                <p>Configure your exam details and select the target groups.</p>
            </div>

            {show && <Flash message={flashMessage} show={show} setShow={setShow} type={type} />}

            <div className="create-exam-layout">
                {/* Left Column: Group Selection */}
                <div className="group-selection-section">
                    <div className="section-title">
                        <span>Select Groups</span>
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {allGroups.length > 0 ? (
                        <div className="groups-grid">
                            {filteredGroups.map((grp) => (
                                <div
                                    key={grp._id}
                                    className={`group-card ${checked.includes(grp._id) ? 'selected' : ''}`}
                                    onClick={() => handleChecking(grp._id)}
                                >
                                    <div className="card-header">
                                        <h3>{grp.groupName}</h3>
                                        <div className="check-indicator">
                                            {checked.includes(grp._id) && <CheckIcon style={{ fontSize: 16 }} />}
                                        </div>
                                    </div>
                                    <div className="card-meta">
                                        <span><strong>Created By:</strong> {grp.createdBy}</span>
                                        <span><strong>Members:</strong> {grp.members?.length || 0}</span>
                                        <span><strong>Role:</strong> Admin</span>
                                    </div>
                                </div>
                            ))}
                            {filteredGroups.length === 0 && <p>No groups found matching "{searchTerm}"</p>}
                        </div>
                    ) : (
                        <p>You are not an admin of any group. Create a group first to conduct an exam.</p>
                    )}
                </div>

                {/* Right Column: Configuration Panel */}
                <div className="exam-config-section">
                    <h2 className="section-title">Exam Configuration</h2>

                    <div className="config-group">
                        <label>Exam Name</label>
                        <input
                            type="text"
                            className="config-input"
                            value={exam}
                            onChange={(e) => setexam(e.target.value)}
                            placeholder="e.g., Midterm Physics"
                        />
                    </div>

                    <div className="config-group">
                        <label>Duration (minutes)</label>
                        <input
                            type="number"
                            className="config-input"
                            value={totalTime}
                            onChange={(e) => setTotalTime(e.target.value)}
                            placeholder="e.g., 60"
                        />
                    </div>

                    <div className="config-group">
                        <label>Linear Mode</label>
                        <select
                            className="config-select"
                            value={linearity}
                            onChange={(e) => setlinearity(e.target.value)}
                        >
                            <option value="Yes">Yes (Strict Navigation)</option>
                            <option value="No">No (Free Navigation)</option>
                        </select>
                    </div>

                    <div className="selected-count">
                        {checked.length} Group(s) Selected
                    </div>

                    <div className="action-buttons">
                        <button className="btn-ai" onClick={handleAI}>
                            <AutoAwesomeIcon /> Generate with AI
                        </button>
                        <button className="btn-proceed" onClick={handleProceeding}>
                            Proceed Manually
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateExam;