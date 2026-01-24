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
import LayersClearIcon from '@mui/icons-material/LayersClear';
import { motion } from "framer-motion";

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="settings-page-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div className="settings-header" variants={itemVariants}>
                <h2><SettingsIcon fontSize="large" /> Settings</h2>
            </motion.div>

            {show && <Flash message={flashMessage} type={type} show={show} setShow={setShow} />}

            <motion.div className="settings-section" variants={itemVariants}>
                <h3 className="settings-section-title">Data Management</h3>
                <div className="settings-card">
                    <div className="settings-option-item" onClick={deleteorganQuizHistory}>
                        <div className="option-content">
                            <HistoryIcon className="option-icon" />
                            <div className="option-text">
                                <h3>Clear Organized History</h3>
                                <p>Delete all history of quizzes you have organized.</p>
                            </div>
                        </div>
                        <DeleteIcon color="action" />
                    </div>

                    <div className="settings-option-item" onClick={deleteCreatedGroups}>
                        <div className="option-content">
                            <LayersClearIcon className="option-icon" />
                            <div className="option-text">
                                <h3>Delete Created Groups</h3>
                                <p>Remove all groups you have created. This cannot be undone.</p>
                            </div>
                        </div>
                        <DeleteIcon color="action" />
                    </div>
                </div>
            </motion.div>

            <motion.div className="settings-section danger-zone" variants={itemVariants}>
                <h3 className="settings-section-title danger-title">
                    <WarningAmberIcon fontSize="small" /> Danger Zone
                </h3>
                <div className="settings-card danger-zone-card">
                    <div className="settings-option-item" onClick={deleteAcc}>
                        <div className="option-content">
                            <PersonOffIcon className="option-icon danger-icon" />
                            <div className="option-text danger-text">
                                <h3>Delete Account</h3>
                                <p>Permanently remove your account and all data.</p>
                            </div>
                        </div>
                        <button className="btn-danger-action">Delete Account</button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Settings;
