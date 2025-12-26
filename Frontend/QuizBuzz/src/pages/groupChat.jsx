import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "../Styles/groupChat.css";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [allMsgs, setallMsgs] = useState([]);
  const [userData, setuserData] = useState("");
  const socketRef = useRef(null);
  const [newMsg, setnewMsg] = useState("");
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

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

    socketRef.current.emit("grp-message", { username, newMsg, id });
    const newtxt2 = {
      sender: username,
      message: newMsg,
      roomId: id,
      time: Date.now()
    };
    // Optimistic update? socket listner handles it for everyone including sender usually, 
    // but if the backend emits to sender too, we don't need to add it manually here.
    // The original code relied on socket event for update, so we'll trust the socket event listener above.
    // Wait, original code emitted AND manually added to UI? 
    // Let's check original...
    // Original: Emits -> Creates object -> setnewMsg("") -> Post to DB.
    // And Listener: Adds to state.
    // If the server broadcasts to everyone including sender, we might get double messages if we add here.
    // Standard socket.io broadcast usually excludes sender.
    // Let's stick to the pattern: Send -> Add to State locally -> API call to persist.

    // Actually, let's play safe and follow the original logic of adding to state via local update?
    // Original code: 
    // socketRef.current.on("grp-message"...) -> adds to allMsgs
    // handleSubmit -> emits... then setnewMsg("")... then axios.post...
    // It DOES NOT add to allMsgs in handleSubmit in original code! It relies on the socket event coming back!
    // Ah, wait. The original code did `socketRef.current.emit` and then `axios.post`. 
    // The `socketRef.current.on` handles the incoming message. 
    // If the server emits to `io.to(room)`, sender gets it back. So we rely on the listener.

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

  return (
    <div className="group-chat-container">

      <div className="chat-header-bar">
        <div className="header-title">
          <h2>
            <button className="back-btn-chat" onClick={goBack}>
              <ArrowBackIcon />
            </button>
            Group Chat
          </h2>
        </div>
      </div>

      <div className="chat-messages-area">
        {allMsgs && allMsgs.map((msg, ind) => (
          <div
            key={ind}
            className={`message-bubble-wrapper ${msg.sender === userData.username ? "sent" : "received"}`}
          >
            <span className="sender-name">{msg.sender}</span>
            <div className="message-content">
              {msg.message}
            </div>
            <span className="message-timestamp">
              {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-form-styled" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input-field"
            value={newMsg}
            onChange={handleChange}
            placeholder="Type your message..."
            required
          />
          <button type="submit" className="btn-send-msg" disabled={!newMsg.trim()}>
            <SendIcon fontSize="small" style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>

    </div>
  );
}
export default GroupChat;
