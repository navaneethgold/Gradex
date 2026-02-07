import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import '../Styles/groups.css';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { motion } from "framer-motion";

const Groups = () => {
  const [group, setGroup] = useState("");
  const [allGroups, setAllGroups] = useState([]);
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [roles, setRoles] = useState([]); // Array of { groupId, role }
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/groups/all`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data.fetched) {
        setAllGroups(res.data.allg);
        setRoles(res.data.roles);
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

  const handleChange = (event) => {
    setGroup(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!group.trim()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/groups/create`, { groupName: group }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setGroup("");
      if (res.data.created) {
        setflashMessage(res.data.message);
        setistype("success");
        fetchGroups();
      } else {
        setflashMessage(res.data.message);
        setistype("error");
      }
    } catch (error) {
      console.error(error);
      setflashMessage("Failed to create group");
      setistype("error");
    }
  };

  const handleViewGroup = (id) => {
    navigate(`/groups/${id}`);
  };

  // Filter groups
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
      className="groups-page-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {flashMessage && <Flash message={flashMessage} type={type} />}

      {/* Header & Create Group Section */}
      <motion.div className="groups-header-section" variants={itemVariants}>
        <div className="groups-titleing">
          <h1>Your Classes</h1>
          <p>Manage your classes and collaborative spaces.</p>
        </div>

        <div className="create-group-wrapper">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="create-group-input"
              placeholder="Enter new class name..."
              value={group}
              onChange={handleChange}
            />
            <button type="submit" className="create-group-btn" disabled={!group.trim()}>
              <AddCircleOutlineIcon /> <span>Create Class</span>
            </button>
          </form>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div className="groups-search-section" variants={itemVariants}>
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search your classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Groups Grid */}
      <motion.div className="groups-grid" variants={containerVariants}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map((grp) => {
            // Determine Role
            const roleObj = roles.find(r => r.groupId === grp._id);
            const userRole = roleObj ? roleObj.role : 'Member';
            const isAdmin = userRole === 'admin';

            return (
              <motion.div
                key={grp._id}
                className="group-card-item"
                onClick={() => handleViewGroup(grp._id)}
                variants={itemVariants}
              >
                <div className="group-card-header">
                  <h3>{grp.groupName}</h3>
                  <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                    {isAdmin ? <AdminPanelSettingsIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                    {isAdmin ? 'Teacher' : 'Student'}
                  </span>
                </div>

                <div className="group-card-body">
                  <div className="group-stat">
                    <GroupsIcon fontSize="small" />
                    <span>{grp.members ? grp.members.length : 0} Students</span>
                  </div>
                  <div className="group-stat">
                    <span>Created: {new Date(grp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="group-card-footer">
                  <span className="view-link">View Details &rarr;</span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div className="no-groups-state" variants={itemVariants}>
            <p>No classes found matching "{searchTerm}"</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Groups;