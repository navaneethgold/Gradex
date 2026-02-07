import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import "../Styles/LeaderBoard.css";
import ToastManager, { notify } from "../components/ToastManager";

// Icons
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const LeaderBoard = () => {
  const { exam } = useParams();
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify.error("Authentication required.");
      return;
    }

    const getLeader = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/analytics/${exam}/leaderboard`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.got) {
          setAnalysis(res.data.leader);
        } else {
          notify.error("Could not fetch leaderboard data");
        }
      } catch (err) {
        console.error(err);
        notify.error("Error loading leaderboard");
      } finally {
        setLoading(false);
      }
    };
    getLeader();
  }, [exam]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return <div className="leader-loading-container">Loading Leaderboard...</div>;
  }

  return (
    <div className="leader-container">
      <ToastManager />

      <motion.div
        className="leader-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="leader-title">
          <EmojiEventsIcon fontSize="large" style={{ color: "#FFD700" }} />
          Leaderboard
        </h1>
        <p className="leader-subtitle">Top performers for this exam</p>
      </motion.div>

      <div className="leader-card">
        {analysis.length > 0 ? (
          <table className="leader-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>Score</th>
                <th className="leader-hide-mobile">Accuracy</th>
                <th className="leader-hide-mobile">Time Taken</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {analysis.map((entry, index) => {
                // Calculate rank style
                let rankClass = "rank-other";
                if (index === 0) rankClass = "rank-1";
                else if (index === 1) rankClass = "rank-2";
                else if (index === 2) rankClass = "rank-3";

                // Calculate accuracy
                const accuracy = entry.totalQ > 0
                  ? Math.round((entry.correctQ / entry.totalQ) * 100)
                  : 0;

                return (
                  <motion.tr
                    key={entry._id || index}
                    variants={itemVariants}
                  >
                    <td>
                      <div className="leader-rank-cell">
                        <div className={`leader-rank-badge ${rankClass}`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="leader-user-info">{entry.examWho}</td>
                    <td>
                      <span className="leader-score-badge">
                        {entry.marks} pts
                      </span>
                    </td>
                    <td className="leader-hide-mobile">
                      {accuracy}% ({entry.correctQ}/{entry.totalQ})
                    </td>
                    <td className="leader-hide-mobile">
                      <span className="leader-time">{entry.duration || "-"} min</span>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        ) : (
          <div className="leader-empty">
            <h3>No attempts yet</h3>
            <p>Be the first to complete this exam!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderBoard;
