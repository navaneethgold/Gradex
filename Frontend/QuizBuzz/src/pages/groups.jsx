import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash";
import '../Styles/groups.css';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const Groups = () => {
  const [group, setGroup] = useState("");
  const [allGroups, setAllGroups] = useState([]);
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // New search state
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/groups/getAll`, {
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
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/groups/new/${group}`, {}, {
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

  return (
    <div className="groups-page-container">
      {flashMessage && <Flash message={flashMessage} type={type} />}

      <div className="groups-header-section">
        <div className="groups-titleing">
          <h1>Your Groups</h1>
          <p>Manage your classes and collaborative spaces.</p>
        </div>

        <div className="create-group-wrapper">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="create-group-input"
              onChange={handleChange}
              value={group}
              placeholder="New Group Name..."
              required
            />
            {token ? (
              <button type="submit" className="btn-create-group">
                <AddCircleOutlineIcon style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '4px' }} />
                Create
              </button>
            ) : (
              <button disabled className="btn-create-group" style={{ opacity: 0.6 }}>Login to Create</button>
            )}
          </form>
        </div>
      </div>

      <div className="groups-controls">
        <input
          type="text"
          className="search-groups-input"
          placeholder="Search your groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="groups-grid">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((grp, index) => (
            <div key={grp._id} className="group-card-item">
              <div className="card-top">
                <div className="group-name">{grp.groupName}</div>
                <div className="group-creator">
                  From: {grp.createdBy}
                </div>
              </div>

              <div className="card-stats">
                <div className="stat-item">
                  <GroupsIcon style={{ fontSize: '1rem' }} />
                  <span>{grp.members?.length || 0} Members</span>
                </div>
                <div className="stat-item">
                  <PersonIcon style={{ fontSize: '1rem' }} />
                  <span>{roles[index] || 'Member'}</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-view-group" onClick={() => handleViewGroup(grp._id)}>
                  View Group
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-groups">
            {searchTerm ? `No groups match "${searchTerm}"` : "You haven't joined any groups yet. Create one above!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;