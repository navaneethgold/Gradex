// Updated Home Component with Analytics Summary + Bar Chart + Improved CSS
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Flash from "./flash.jsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "../Styles/home.css";

const COLORS = ["#0088FE", "#FF8042", "#00C49F"];

const Home = () => {
  const [isLogged, setisLogged] = useState(false);
  const [userData, setuserData] = useState({});
  const [flashMessage, setflashMessage] = useState("");
  const [type, setistype] = useState("");
  const [allExams, setallExams] = useState([]);
  const [grpNames, setgrpNames] = useState({});
  const [allAnalytics, setAllAnalytics] = useState([]);
  const [organised, setOrganised] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setisLogged(false);
        setflashMessage("No token found. Please log in.");
        setistype("error");
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-login`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.isLoggedIn) {
          setisLogged(true);
          setuserData(res.data.user);
          setflashMessage(res.data.message);
          setistype(res.data.type || "success");
        } else {
          setisLogged(false);
          setflashMessage("Not logged in");
          setistype("error");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setisLogged(false);
        setflashMessage("Not logged in");
        setistype("error");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      if (!userData?.username) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/home/getExams/${userData.username}`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.gotExams) {
          setallExams(res.data.exams);
          setgrpNames(res.data.grpNames);
          setOrganised(res.data.iorgan);
        }
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };
    fetchExams();
  }, [userData]);

  useEffect(() => {
    const getAllAnalytics = async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/getAllAnalytics`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.got) {
        setAllAnalytics(res.data.allana);
      }
    };
    getAllAnalytics();
  }, []);

  const startExam = async (name) => {
    await axios.put(`${import.meta.env.VITE_API_BASE_URL}/${name}/setEnd`, {}, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    navigate(`/start-exam/${name}`);
  };

  const totalCorrect = allAnalytics.reduce((acc, curr) => acc + curr.correctQ, 0);
  const totalQuestions = allAnalytics.reduce((acc, curr) => acc + curr.totalQ, 0);
  const totalUnattempted = allAnalytics.reduce((acc, curr) => acc + curr.unattempted, 0);

  const avgAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : 0;
  const avgUnattempted = totalQuestions > 0 ? ((totalUnattempted / totalQuestions) * 100).toFixed(2) : 0;

  const summaryData = [
    { name: "Correct", value: totalCorrect },
    { name: "Unattempted", value: totalUnattempted },
    { name: "Incorrect", value: totalQuestions - totalCorrect - totalUnattempted },
  ];

  const barChartData = allAnalytics.map((entry, idx) => ({
    name: `Exam ${idx + 1}`,
    Accuracy: +((entry.correctQ / entry.totalQ) * 100).toFixed(2),
  }));

  return (
    <div className="home-page">
      <h1 className="exam-heading">Your Overall Performance</h1>
      {allAnalytics.length > 0 && (
        <div className="summary-section">
          <div className="summary-chart">
            <h3>Summary</h3>
            <ResponsiveContainer width="100%" height={250} id="cont">
              <PieChart>
                <Pie
                  data={summaryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="summary-text">
            <p><strong>Total Correct Answers:</strong> {totalCorrect}</p>
            <p><strong>Total Questions:</strong> {totalQuestions}</p>
            <p><strong>Average Accuracy:</strong> {avgAccuracy}%</p>
            <p><strong>Average Unattempted:</strong> {avgUnattempted}%</p>
          </div>
        </div>
      )}

      {barChartData.length > 0 && (
        <div className="barchart-section">
          <h3>Accuracy Across Exams</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Accuracy" fill="#8884d8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <h1 className="exam-heading">Your Exams</h1>
      <div className="exam-grid">
        {allExams.length > 0 ? (
          allExams.map((exam) => (
            <div className="exam-card" key={exam._id}>
              <h2>{exam.examName}</h2>
              <p><strong>Created by:</strong> {exam.createdBy}</p>
              <p><strong>Groups:</strong> {exam.groups.map((grp) => grpNames[grp] || grp).join(", ")}</p>
              <p><strong>Duration:</strong> {exam.duration} minutes</p>
              <p><strong>Created on:</strong> {new Date(exam.createtime).toLocaleString()}</p>
              {!exam.submitted.includes(userData.userId) && (
                <button className="start-btn" onClick={() => startExam(exam._id)}>
                  {exam.endTime.includes(userData.username) ? "Resume Exam" : "Start Exam"}
                </button>
              )}
              {exam.submitted.includes(userData.userId) && (
                <div className="completed-section">
                  <button className="start-btn completed">Exam Completed</button>
                  <button className="start-btn view-analytics" onClick={() => navigate(`/${exam._id}/analytics`)}>View Analytics</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No exams available yet.</p>
        )}
      </div>
      <h1 className="exam-heading">Exams Organised by You</h1>
      <div className="organised">
        <div className="exam-grid">
          {organised.length > 0 ? (
            organised.map((exam) => (
              <div className="exam-card" key={exam._id}>
                <h2>{exam.examName}</h2>
                <p><strong>Created by:</strong> {exam.createdBy}</p>
                <p><strong>Groups:</strong> {exam.groups.map((grp) => grpNames[grp] || grp).join(", ")}</p>
                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                <p><strong>Created on:</strong> {new Date(exam.createtime).toLocaleString()}</p>
                <div className="completed-section">
                  <button className="start-btn view-analytics" onClick={() => navigate(`/${exam._id}/analytics/leaderboard`)}>View Analytics</button>
                </div>
              </div>
            ))
          ) : (
            <p>No exams available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
