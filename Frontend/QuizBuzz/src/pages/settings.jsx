import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../Styles/settings.css";
import Flash from "./flash";
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const Settings = () => {
    const token = localStorage.getItem("token");
    const [flashMessage, setflashMessage] = useState("");
    const [type, setistype] = useState("");
    const [show, setShow] = useState(false);
    const navigate = useNavigate();

    const deleteorganQuizHistory = async () => {
        if (!confirm("Are you sure you want to delete all organized quizzes? This cannot be undone.")) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteOrganQuizes`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.deleted) {
                setflashMessage("✅ Successfully deleted all quizzes you organized.");
                setistype("success");
            } else {
                setflashMessage("❌ Failed to delete organized quizzes.");
                setistype("error");
            }
        } catch {
            setflashMessage("❌ Server error while deleting organized quizzes.");
            setistype("error");
        }
        setShow(true);
    };

    const deleteCreatedGroups = async () => {
        if (!confirm("Are you sure you want to delete all created groups? This cannot be undone.")) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteCreatedGroups`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.deleted) {
                setflashMessage("✅ Successfully deleted all groups.");
                setistype("success");
            } else {
                setflashMessage("❌ Failed to delete Groups.");
                setistype("error");
            }
        } catch {
            setflashMessage("❌ Server error while deleting groups.");
            setistype("error");
        }
        setShow(true);
    };

    const deleteAcc = async () => {
        if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
        try {
            const res1 = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteOrganQuizes`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
            const res2 = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteCreatedGroups`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
            const res3 = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/deleteAccount`, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res1.data.deleted && res2.data.deleted && res3.data.deleted) {
                setflashMessage("✅ Account and all related data deleted successfully.");
                setistype("success");
                setShow(true);
                setTimeout(() => {
                    navigate("/signUp");
                }, 3000);
            } else {
                throw new Error("Incomplete deletion");
            }
        } catch {
            setflashMessage("❌ Failed to delete account.");
            setistype("error");
            setShow(true);
        }
    };

    return (
        <div className="settings-page-container">
            <div className="settings-header">
                <h2><SettingsIcon fontSize="large" /> Settings</h2>
            </div>

            {show && <Flash message={flashMessage} type={type} show={show} setShow={setShow} />}

            {/* General Settings Section - Placeholder for future */}
            {/* 
            <div>
                <h3 className="settings-section-title">General</h3>
                <div className="settings-card">
                    ...
                </div>
            </div> 
            */}

            {/* Danger Zone Section */}
            <div>
                <h3 className="settings-section-title" style={{ color: '#ef4444' }}>Danger Zone</h3>
                <div className="settings-card danger-zone-card">

                    <div className="settings-option-item" onClick={deleteorganQuizHistory}>
                        <div className="option-content">
                            <HistoryIcon sx={{ color: "#ef4444" }} />
                            <div className="option-text danger-text">
                                <h3>Delete Organized Quizzes</h3>
                                <p>Permanently remove all quizzes you have created.</p>
                            </div>
                        </div>
                        <button className="btn-danger-action">Delete History</button>
                    </div>

                    <div className="settings-option-item" onClick={deleteCreatedGroups}>
                        <div className="option-content">
                            <DeleteIcon sx={{ color: "#ef4444" }} />
                            <div className="option-text danger-text">
                                <h3>Delete Created Groups</h3>
                                <p>Permanently remove all groups you manage.</p>
                            </div>
                        </div>
                        <button className="btn-danger-action">Delete Groups</button>
                    </div>

                    <div className="settings-option-item" onClick={deleteAcc}>
                        <div className="option-content">
                            <PersonOffIcon sx={{ color: "#ef4444" }} />
                            <div className="option-text danger-text">
                                <h3>Delete Account</h3>
                                <p>Permanently delete your account and all data.</p>
                            </div>
                        </div>
                        <button className="btn-danger-action delete-account-btn">Delete Account</button>
                    </div>

                </div>
            </div>

        </div>
    );
};
export default Settings;
