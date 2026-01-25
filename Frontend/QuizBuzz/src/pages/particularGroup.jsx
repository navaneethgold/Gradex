import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "../Styles/particularGroup.css";
import Flash from "./flash";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';

export default function Pgroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMember, setNewMember] = useState("");
  const [flash, setFlash] = useState({ message: "", type: "" });

  const token = localStorage.getItem("token");

  const fetchGroup = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/groups/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setGroup(res.data.grp);
    } catch (err) {
      console.error("Error fetching group:", err);
      setFlash({ message: "Group not found or unauthorized", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const handleAddMember = async () => {
    if (!newMember.trim()) return;
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/groups/${id}/addmem`,
        { email: newMember },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      setFlash({ message: res.data.message, type: "success" });
      setNewMember("");
      fetchGroup(); // Refresh group data
    } catch (error) {
      console.error("Failed to add member:", error);
      setFlash({ message: error.response?.data?.message || "Error adding member", type: "error" });
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/groups/${id}/removemem`,
        { part: member },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      if (res.data.removed) {
        setFlash({ message: res.data.message, type: "success" });
        fetchGroup(); // Refresh data
      }
    } catch (error) {
      setFlash({ message: error.response?.data?.message || "Error removing member", type: "error" });
    }
  };

  const handleGroupChat = () => {
    try {
      navigate(`/groups/${id}/groupChat`);
    } catch (err) {
      console.log(err);
    }
  };

  const goBack = () => {
    navigate('/groups');
  }

  // Animation Variants
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

  if (loading) return (
    <div className="group-details-container">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading-text"
      >
        Loading Group Details...
      </motion.p>
    </div>
  );

  if (!group) return (
    <div className="group-details-container">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error-text"
      >
        Group not found or unauthorized.
      </motion.p>
    </div>
  );

  return (
    <motion.div
      className="group-details-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {flash.message && (
        <Flash message={flash.message} type={flash.type} />
      )}

      {/* Header Section */}
      <motion.div className="details-header-card" variants={itemVariants}>
        <div className="group-info">
          <div className="group-title-row">
            <motion.div
              className="back-btn-wrapper"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
            >
              <ArrowBackIcon className="back-btn-icon" fontSize="medium" />
            </motion.div>
            <h2>{group.groupName}</h2>
          </div>

          <div className="group-meta">
            <div className="meta-badge">
              <AdminPanelSettingsIcon fontSize="small" />
              <span>Created by <strong>{group.createdBy}</strong></span>
            </div>
            <div className="meta-badge">
              <GroupIcon fontSize="small" />
              <span>{group.members?.length || 0} Members</span>
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleGroupChat}
          className="btn-group-chat"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChatIcon /> Open Group Chat
        </motion.button>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="group-dashboard-grid">

        {/* Left Column: Members List */}
        <motion.div className="dashboard-card members-card" variants={itemVariants}>
          <div className="card-header-title">
            <h3><GroupIcon /> Members List</h3>
            <span className="member-count-badge">{group.members?.length || 0}</span>
          </div>
          <div className="card-body members-list-container">
            <AnimatePresence>
              {group.members && group.members.length > 0 ? (
                group.members.map((member, index) => (
                  <motion.div
                    key={member}
                    className="member-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="member-info">
                      <div className="member-avatar">
                        <PersonIcon />
                      </div>
                      <span className="member-email">{member}</span>
                    </div>
                    <motion.button
                      className="btn-remove-member"
                      title="Remove Member"
                      onClick={() => handleRemoveMember(member)}
                      whileHover={{ scale: 1.1, color: "#ef4444" }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <DeleteOutlineIcon />
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <p className="no-members">No members in this group yet.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Column: Admin Actions */}
        <motion.div className="dashboard-card admin-actions-card" variants={itemVariants}>
          <div className="card-header-title">
            <h3><PersonAddIcon /> Add New Member</h3>
          </div>
          <div className="card-body">
            <div className="add-member-form">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <PersonIcon className="input-icon" />
                <input
                  type="email"
                  className="add-input"
                  placeholder="Enter user email..."
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                />
              </div>
              <motion.button
                className="btn-add-member"
                onClick={handleAddMember}
                disabled={!newMember.trim()}
                whileHover={!newMember.trim() ? {} : { scale: 1.02 }}
                whileTap={!newMember.trim() ? {} : { scale: 0.98 }}
              >
                <PersonAddIcon fontSize="small" /> Add Member
              </motion.button>
            </div>

            <div className="info-box">
              <p>Adding a member will give them access to all quizzes and materials within this group.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
