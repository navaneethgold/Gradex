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
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddLinkIcon from '@mui/icons-material/AddLink';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function Pgroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMember, setNewMember] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [newMaterial, setNewMaterial] = useState({ title: "", link: "", file: null });
  const [showMaterials, setShowMaterials] = useState(false);
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
      setFlash({ message: "Class not found or unauthorized", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchGroup();
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-login`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.isLoggedIn) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.error("Auth check failed", err);
    }
  };

  const handleViewMaterial = async (material) => {
    // 1. If it has a direct link, open it
    if (material.link) {
      window.open(material.link, "_blank");
      return;
    }

    // 2. If it has a file (S3 Key), get presigned URL
    if (material.file) {
      try {
        setFlash({ message: "Opening material...", type: "info" });
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/upload/view-presigned-url`,
          { objectKey: material.file },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.url) {
          window.open(res.data.url, "_blank");
          setFlash({ message: "", type: "" }); // Clear info
        }
      } catch (err) {
        console.error("Error viewing material:", err);
        setFlash({ message: "Failed to load material.", type: "error" });
      }
    }
  };

  const handleAddMaterial = async () => {
    // 1. Validation
    if (!newMaterial.title || (!newMaterial.link && !newMaterial.file)) {
      setFlash({ message: "Please provide a title and either a link or a file.", type: "error" });
      return;
    }

    try {
      let objectKey = null;

      // 2. Handle File Upload (if exists)
      if (newMaterial.file) {
        setFlash({ message: "Uploading file...", type: "info" });

        // A. Get Presigned URL
        const presignRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/upload/presigned-url-class`,
          {
            classId: id,
            files: [{ fileName: newMaterial.file.name, fileType: newMaterial.file.type }]
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (presignRes.data.success && presignRes.data.fileUrls && presignRes.data.fileUrls.length > 0) {
          const { uploadUrl, objectKey: key } = presignRes.data.fileUrls[0];
          objectKey = key;

          // B. Upload to S3
          await axios.put(uploadUrl, newMaterial.file, {
            headers: { "Content-Type": newMaterial.file.type }
          });
        } else {
          throw new Error("Failed to get upload URL");
        }
      }

      // 3. Save to Backend
      const payload = {
        title: newMaterial.title,
        link: newMaterial.link,
        file: objectKey || ""
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/groups/${id}/addMaterial`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.added) {
        setFlash({ message: "Material added successfully!", type: "success" });
        setNewMaterial({ title: "", link: "", file: null });
        fetchGroup(); // Refresh list
      } else {
        setFlash({ message: res.data.message || "Failed to add material", type: "error" });
      }

    } catch (err) {
      console.error("Add Material Error:", err);
      setFlash({ message: "Failed to add material. Please try again.", type: "error" });
    }
  };

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
        Loading Class Details...
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
        Class not found or unauthorized.
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
              <span>{group.members?.length || 0} Students</span>
            </div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button
            onClick={() => setShowMaterials(!showMaterials)}
            className="btn-group-chat" // reusing style for consistency
            style={{ background: showMaterials ? 'var(--bg-secondary)' : '', border: showMaterials ? '1px solid var(--accent-primary)' : '', color: showMaterials ? 'var(--accent-primary)' : '' }} // distinct active state
            whileTap={{ scale: 0.95 }}
          >
            <LibraryBooksIcon /> {showMaterials ? "Hide Materials" : "Class Materials"}
          </motion.button>
          <motion.button
            onClick={handleGroupChat}
            className="btn-group-chat"
            whileTap={{ scale: 0.95 }}
          >
            <ChatIcon /> Open Class Chat
          </motion.button>
        </div>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="group-dashboard-grid">

        {/* Left Column: Materials & Members */}
        <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Materials Card */}
          {/* Materials Card */}
          <AnimatePresence>
            {showMaterials && (
              <motion.div
                key="materials-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: 'hidden' }}
              >
                <div className="dashboard-card materials-card">
                  <div className="card-header-title">
                    <h3><LibraryBooksIcon /> Class Materials</h3>
                  </div>
                  <div className="card-body">
                    {/* Materials List */}
                    <div className="materials-list">
                      {group.materials && group.materials.length > 0 ? (
                        group.materials.map((mat, idx) => (
                          <div key={idx} className="material-item" style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <LibraryBooksIcon color="primary" />
                              <div>
                                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{mat.title}</strong>
                                <span
                                  onClick={() => handleViewMaterial(mat)}
                                  style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--accent-primary)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  View Material
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-members">No materials uploaded yet.</p>
                      )}
                    </div>

                    {/* Add Material Section (Creator Only) */}
                    {currentUser && group.createdBy === currentUser.username && (
                      <div className="add-material-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add New Material</h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Title (Required)"
                            className="add-input"
                            style={{ flex: 1, minWidth: '150px' }}
                            value={newMaterial.title}
                            onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Link URL (Optional)"
                            className="add-input"
                            style={{ flex: 1, minWidth: '150px' }}
                            value={newMaterial.link}
                            onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                            disabled={!!newMaterial.file}
                          />

                          {/* File Upload Wrapper */}
                          <div style={{ position: 'relative' }}>
                            <input
                              accept=".pdf,.ppt,.pptx"
                              style={{ display: 'none' }}
                              id="raised-button-file"
                              type="file"
                              onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files[0], link: "" })}
                            />
                            <label htmlFor="raised-button-file">
                              <span
                                className="btn-upload"
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  border: '1px dashed var(--border-color)',
                                  borderRadius: '8px',
                                  color: newMaterial.file ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                  background: newMaterial.file ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                  fontSize: '0.85rem'
                                }}
                              >
                                {newMaterial.file ? <PictureAsPdfIcon fontSize="small" /> : <UploadFileIcon fontSize="small" />}
                                {newMaterial.file ? newMaterial.file.name.substring(0, 15) + (newMaterial.file.name.length > 15 ? "..." : "") : "Upload PDF/PPT"}
                              </span>
                            </label>
                          </div>

                          <button
                            className="btn-add-member"
                            onClick={handleAddMaterial}
                            disabled={!newMaterial.title || (!newMaterial.link && !newMaterial.file)}
                            style={{ width: 'auto' }}
                            title="Add Material"
                          >
                            <AddLinkIcon fontSize="small" /> Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members List */}
          <motion.div className="dashboard-card members-card" variants={itemVariants}>
            <div className="card-header-title">
              <h3><GroupIcon /> Students List</h3>
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
                        title="Remove Student"
                        onClick={() => handleRemoveMember(member)}
                        whileHover={{ color: "#ef4444" }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <DeleteOutlineIcon />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <p className="no-members">No students in this class yet.</p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Admin Actions */}
        <motion.div className="dashboard-card admin-actions-card" variants={itemVariants}>
          <div className="card-header-title">
            <h3><PersonAddIcon /> Add New Student</h3>
          </div>
          <div className="card-body">
            <div className="add-member-form">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <PersonIcon className="input-icon" />
                <input
                  type="email"
                  className="add-input"
                  placeholder="Enter student email..."
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                />
              </div>
              <motion.button
                className="btn-add-member"
                onClick={handleAddMember}
                disabled={!newMember.trim()}
                whileTap={!newMember.trim() ? {} : { scale: 0.98 }}
              >
                <PersonAddIcon fontSize="small" /> Add Student
              </motion.button>
            </div>

            <div className="info-box">
              <p>Adding a student will give them access to all quizzes and materials within this class.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
