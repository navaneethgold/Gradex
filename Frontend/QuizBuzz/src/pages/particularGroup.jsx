import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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

  if (loading) return <div className="group-details-container"><p className="loading-text">Loading Group Details...</p></div>;
  if (!group) return <div className="group-details-container"><p className="error-text">Group not found or unauthorized.</p></div>;

  return (
    <div className="group-details-container">
      {flash.message && (
        <Flash message={flash.message} type={flash.type} />
      )}

      {/* Header Section */}
      <div className="details-header-card">
        <div className="group-info">
          <h2>
            <ArrowBackIcon className="back-btn-icon" onClick={goBack} fontSize="inherit" />
            {group.groupName}
          </h2>
          <div className="group-meta">
            <AdminPanelSettingsIcon fontSize="small" />
            <span>Created by: <strong>{group.createdBy}</strong></span>
          </div>
        </div>
        <button onClick={handleGroupChat} className="btn-group-chat">
          <ChatIcon /> Open Group Chat
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="group-dashboard-grid">

        {/* Left Column: Members List */}
        <div className="dashboard-card members-card">
          <div className="card-header-title">
            <h3><GroupIcon /> Group Members ({group.members?.length || 0})</h3>
          </div>
          <div className="card-body members-list-container">
            {group.members && group.members.length > 0 ? (
              group.members.map((member, index) => (
                <div key={index} className="member-item">
                  <div className="member-info">
                    <PersonIcon style={{ color: '#94a3b8' }} />
                    <span>{member}</span>
                  </div>
                  <button
                    className="btn-remove-member"
                    title="Remove Member"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <DeleteOutlineIcon />
                  </button>
                </div>
              ))
            ) : (
              <p className="no-members">No members in this group yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Admin Actions */}
        <div className="dashboard-card admin-actions-card">
          <div className="card-header-title">
            <h3><PersonAddIcon /> Add Member</h3>
          </div>
          <div className="card-body">
            <div className="add-member-form">
              <input
                type="email"
                className="add-input"
                placeholder="Enter member email"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
              />
              <button
                className="btn-add-member"
                onClick={handleAddMember}
                disabled={!newMember.trim()}
              >
                <PersonAddIcon fontSize="small" /> Add to Group
              </button>
            </div>
            {/* Future: Add more admin settings here */}
          </div>
        </div>

      </div>
    </div>
  );
}
