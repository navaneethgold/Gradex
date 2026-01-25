import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import "../Styles/groupChat.css";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import Avatar from '@mui/material/Avatar';

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [allMsgs, setallMsgs] = useState([]);
  const [userData, setuserData] = useState("");
  const socketRef = useRef(null);
  const [newMsg, setnewMsg] = useState("");
  const messagesEndRef = useRef(null); // Ref for auto-scrolling
  const [isTyping, setIsTyping] = useState(false); // Placeholder for future typing indicator

  // Fetch initial chat history
  useEffect(() => {
    const getmsgs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/groups/${id}/fetchgroupChat`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.fetched) {
          setallMsgs(res.data.message);
          setuserData(res.data.puser);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    getmsgs();
  }, [id, token]);

  // Socket connection
  useEffect(() => {
    if (!userData || !userData.userId || socketRef.current || !id) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { userId: userData.userId },
      withCredentials: true
    });

    socketRef.current.emit("join-room", { roomId: id });

    socketRef.current.on("grp-message", ({ username, newMsg, id }) => {
      const newtxt = {
        sender: username,
        message: newMsg,
        roomId: id,
        time: Date.now()
      };
      setallMsgs((prev) => [...prev, newtxt]);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userData, id]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMsgs]);

  const handleChange = (e) => {
    setnewMsg(e.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let username = userData.username;
    if (!socketRef.current || newMsg.trim() === '') return;

    // Optimistic UI update could happen here, but we rely on socket echo currently
    // to avoid duplication if the backend broadcasts to sender too.
    socketRef.current.emit("grp-message", { username, newMsg, id });

    // Create temp object for API call (structure depends on backend implementation)
    const newtxt2 = {
      sender: username,
      message: newMsg,
      roomId: id,
      time: Date.now()
    };

    // Optimistic Update removed as Socket handles broadcast

    setnewMsg("");

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/groups/${id}/addmsg`, { newtxt2 }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error saving message", error);
    }
  };

  const goBack = () => {
    navigate(`/groups/${id}`);
  }

  // Animation variants
  const messageVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="group-chat-container">

      {/* Header */}
      <motion.div
        className="chat-header-bar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="header-left">
          <motion.button
            className="back-btn-chat"
            onClick={goBack}
            whileHover={{ scale: 1.1, backgroundColor: "var(--hover-bg)" }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowBackIcon fontSize="medium" />
          </motion.button>
          <div className="header-info">
            <h2>Group Chat</h2>
            <span className="online-status">Active now</span>
          </div>
        </div>
        {/* Placeholder for group info or actions */}
      </motion.div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {allMsgs && allMsgs.map((msg, ind) => {
          const isSender = msg.sender === userData.username;
          const showAvatar = ind === 0 || allMsgs[ind - 1].sender !== msg.sender;

          return (
            <motion.div
              key={ind}
              className={`message-row ${isSender ? "row-sent" : "row-received"}`}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              transition={{ duration: 0.2 }}
            >
              {!isSender && (
                <div className="avatar-spacer">
                  {showAvatar ? (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: stringToColor(msg.sender),
                        fontSize: '0.9rem'
                      }}
                    >
                      {msg.sender[0].toUpperCase()}
                    </Avatar>
                  ) : <div className="avatar-placeholder" />}
                </div>
              )}

              <div className={`message-bubble-wrapper ${isSender ? "sent" : "received"}`}>
                {!isSender && showAvatar && <span className="sender-name">{msg.sender}</span>}
                <div className="message-content">
                  {msg.message}
                </div>
                <span className="message-timestamp">
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        className="chat-input-wrapper"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <form className="chat-form-styled" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input-field"
            value={newMsg}
            onChange={handleChange}
            placeholder="Type a message..."
            autoFocus
          />
          <motion.button
            type="submit"
            className="btn-send-msg"
            disabled={!newMsg.trim()}
            whileHover={!newMsg.trim() ? {} : { scale: 1.1 }}
            whileTap={!newMsg.trim() ? {} : { scale: 0.9 }}
          >
            <SendIcon fontSize="small" />
          </motion.button>
        </form>
      </motion.div>

    </div>
  );
}

// Utility to generate consistent color from string
function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

export default GroupChat;
