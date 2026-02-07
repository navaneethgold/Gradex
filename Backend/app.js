import express from 'express';
import { createServer } from "node:http";
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import Messaging from './controllers/chatting.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import examRoutes from './routes/examRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import AIQuestionRoute from "./routes/gemini.js";
import fileRoute from "./routes/fileRoutes/file.js";

dotenv.config();
const app = express();
const server = createServer(app);

// Initialize Chat Messaging
Messaging(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  "https://smart-quiz-app-e3c9.onrender.com",
  "https://smart-quiz-app-two.vercel.app"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    console.log("CORS request from:", origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(session(sessionOptions));

// Database Connection
const db_url = process.env.MONGO_URI;
async function main() {
  await mongoose.connect(db_url);
}
main().then(() => {
  console.log("Connected-Successfully");
}).catch((error) => {
  console.log("Not-Connected");
  console.log(error);
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", fileRoute);
app.use("/", AIQuestionRoute); // Legacy mount point or specific handling

// Health Check
app.get("/ping", (req, res) => {
  res.send("Backend is alive!");
});

// Start Server
server.listen("8000", () => {
  console.log("server is listening on port 8000");
});