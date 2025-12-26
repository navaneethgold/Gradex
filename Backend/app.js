import express from 'express';
import bcrypt from 'bcrypt';
import { createServer } from "node:http";
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import user from './models/user.js';
import auth from './routes/auth.js';
import group from './models/groups.js';
import { error, time } from 'node:console';
import msgs from './models/messages.js';
import Messaging from './controllers/chatting.js';
import exam from './models/exam.js';
import question from './models/Questions.js';
import answer from './models/answers.js';
import analytic from './models/analytics.js';
import AIQuestionRoute from "./routes/gemini.js"
dotenv.config();
const app = express();
const server = createServer(app);
Messaging(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    domain: "smart-quiz-app-e3c9.onrender.com",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
const allowedOrigins = [
  "http://localhost:5173",
  "https://smart-quiz-app-e3c9.onrender.com",   // production
  "https://smart-quiz-app-two.vercel.app"
]
app.use(cors({
  origin: (origin, callback) => {
    console.log("CORS request from:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}))
app.use(session(sessionOptions));
const db_url = process.env.MONGO_URI;
main().then(() => {
  console.log("Connected-Successfully");
}).catch((error) => {
  console.log("Not-Connected");
  console.log(error);
})
async function main() {
  await mongoose.connect(db_url);
}
app.use("/", AIQuestionRoute);

app.post("/signUp", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const new_user = new user({ username, email, password: hashedPassword });
    await new_user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userExist = await user.findOne({ username: username });
  if (!userExist) return res.status(400).json({ message: "Invalid Username" });
  const userMatch = await bcrypt.compare(password, userExist.password);
  if (!userMatch) return res.status(400).json({ message: "Invalid Password" });
  const token = jwt.sign(
    {
      userId: userExist._id,
      email: userExist.email,
      username: userExist.username   // optional: any fields you want to access later
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.status(200).json({ token, message: "Login successful" })
})

app.get("/api/auth/check-login", auth, (req, res) => {
  console.log(req.user);
  res.status(200).json({
    isLoggedIn: true,
    user: req.user,
    message: "Token is valid"
  });
})

app.post("/groups/new/:gn", auth, async (req, res) => {
  const { gn } = req.params;
  try {
    const puser = req.user.username;
    const grpExists = await group.findOne({ groupName: gn, createdBy: puser });
    if (grpExists) return res.json({ message: "Group already exists", created: false });
    const new_grp = {
      groupName: gn,
      createdBy: puser
    }
    const registered_grp = new group(new_grp);
    await registered_grp.save();
    return res.status(200).json({ message: "Group created Successfully", created: true });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Failed to create a group", created: false })
  }
})


app.get("/groups/getAll", auth, async (req, res) => {
  try {
    const allGroups = await group.find({
      $or: [
        { createdBy: req.user.username },
        { members: req.user.username }
      ]
    });
    const role = [];
    for (const grp of allGroups) {
      if (grp.createdBy === req.user.username) {
        role.push("Admin");
      } else {
        role.push("Participant")
      }
    }
    return res.status(200).json({ message: "Fetched all groups", fetched: true, allg: allGroups, roles: role });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Failed to fetch groups", fetched: false });
  }
})

app.get("/groups/getAdmins", auth, async (req, res) => {
  try {
    const allGroups = await group.find({ createdBy: req.user.username });
    return res.status(200).json({ message: "Fetched all groups", fetched: true, allg: allGroups });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Failed to fetch groups", fetched: false });
  }
})

app.get("/groups/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const grou = await group.findOne({ _id: id });
    return res.status(200).json({ message: "Successfully fetched", fetched: true, grp: grou });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "failed to fetch", fetched: false });
  }

})

app.put("/groups/:id/addmem", auth, async (req, res) => {
  const groupId = req.params.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required.", added: false });
  }

  try {
    const pgroup = await group.findById(groupId);
    if (!pgroup) {
      return res.status(404).json({ message: "Group not found.", added: false });
    }

    // Optional: Only allow creator to add members
    if (pgroup.createdBy !== req.user.username) {
      console.log(pgroup.createdBy);
      console.log(req.user.email);
      return res.status(403).json({ message: "Only group creator can add members.", added: false });
    }

    //Check if user exists
    const puser = await user.findOne({ email });
    if (!puser) {
      return res.status(404).json({ message: "No user found with this email.", added: false });
    }

    //Prevent duplicate
    if (pgroup.members.includes(puser.username)) {
      return res.status(400).json({ message: "User is already a member of this group.", added: false });
    }

    //Add member
    pgroup.members.push(puser.username);
    await pgroup.save();

    return res.status(200).json({ message: "Member added successfully.", added: true });
  } catch (error) {
    console.error("Error adding member:", error);
    return res.status(500).json({ message: "Internal server error.", added: false });
  }
});

app.put("/groups/:id/removemem", auth, async (req, res) => {
  const { id } = req.params;
  const { part } = req.body;
  try {
    const pgroup = await group.findById(id);
    if (!pgroup) {
      return res.status(404).json({ message: "Group not found", removed: false });
    }
    if (pgroup.createdBy !== req.user.username) {
      return res.status(403).json({ message: "Only the group creator can remove members.", removed: false });
    }
    const index = pgroup.members.indexOf(part);
    if (index === -1) {
      return res.status(404).json({ message: "User not found in the group", removed: false });
    }
    pgroup.members.splice(index, 1);
    await pgroup.save();
    return res.status(200).json({ message: "Member removed successfully", removed: true });
  } catch (err) {
    console.error("Remove member error:", err);
    return res.status(500).json({ message: "An error occurred while removing the member", removed: false });
  }
});

app.get("/groups/:id/fetchgroupChat", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const allMsgs = await msgs.find({ roomId: id }).sort({ time: 1 });
    const puser = req.user;
    return res.json({ fetched: true, message: allMsgs, puser: puser });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ fetched: false, message: "failed to fetch chat" })
  }
})

app.post("/groups/:id/addmsg", auth, async (req, res) => {
  const { id } = req.params;
  const { newtxt2 } = req.body;
  try {
    const newtxt3 = new msgs(newtxt2);
    await newtxt3.save();
  } catch (err) {
    console.log(err);
  }
})

app.post("/create-new-exam", auth, async (req, res) => {
  const { groups, examName, duration, linear } = req.body;
  const un = req.user.username;
  try {
    const newExam = new exam({
      examName: examName,
      createdBy: un,
      groups: groups,
      duration: duration,
      linearity: linear
    })
    await newExam.save();
    return res.json({ message: "success", owner: un })
  } catch (err) {
    console.log(err);
    return res.json({ message: "failure" });
  }
})

app.post("/create-new-exam/:exam/create-question", async (req, res) => {
  const { exam } = req.params;
  const { payload } = req.body;
  try {
    const reg_qusetion = new question(payload);
    await reg_qusetion.save();
    return res.json({ message: "Successfully created new question", created: true });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed to save", created: false });
  }

})


app.get("/home/getExams/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const hisGroups = await group.find({ members: username, createdBy: { $ne: username } });
    const groupIds = [];
    for (const grp of hisGroups) {
      groupIds.push(grp._id);
    }
    const corresgrpNames = {};
    const hisExams = await exam.find({ groups: { $in: groupIds } });
    const iorgan = await exam.find({ createdBy: username });
    for (const eachID of groupIds) {
      const pargroup = await group.findOne({ _id: eachID });
      corresgrpNames[eachID] = pargroup.groupName;
    }
    return res.json({ message: "Got exams", gotExams: true, exams: hisExams, grpNames: corresgrpNames, iorgan: iorgan });
  } catch (err) {
    console.log(err);
    return res.json({ message: "failed to get exams", gotExams: false });
  }


})

app.put("/:name/setEnd", auth, async (req, res) => {
  const { name } = req.params;
  const pexam = await exam.findOne({ _id: name });

  if (!pexam) return res.json({ message: "exam not found", set: false });

  const currentUser = req.user.username; // Ensure auth middleware populates this

  // Find if user already commenced exam
  const userTimer = pexam.endTime.find(entry => entry.user === currentUser);

  if (userTimer) {
    if (userTimer.time) {
      return res.json({ message: "you already started your exam", set: false, end: userTimer.time });
    }
  }

  // Calculate new end time
  const newEndTime = new Date(Date.now() + pexam.duration * 60 * 1000);

  // Push to array
  pexam.endTime.push({ user: currentUser, time: newEndTime });
  await pexam.save();

  return res.json({ message: "Exam is started", end: newEndTime, set: true });
})

app.get("/:name/getQuestions", auth, async (req, res) => {
  const { name } = req.params;
  try {
    const Myexam = await exam.findOne({ _id: name });
    if (!Myexam) {
      return res.json({ message: "No exam found", got: false });
    }
    const allQuestions = await question.find({ examName: Myexam.examName }).sort({ questionNo: 1 });
    const puser = req.user;

    // Process EndTime for THIS user
    let userEndTime = null;
    if (Myexam.endTime && Array.isArray(Myexam.endTime)) {
      const found = Myexam.endTime.find(e => e.user === puser.username);
      if (found) userEndTime = found.time;
    }

    // Clone and override for frontend compatibility
    const examDataToSend = Myexam.toObject();
    examDataToSend.endTime = userEndTime;

    return res.json({ message: "Got all the questions", questions: allQuestions, got: true, Nowexam: examDataToSend, puser: puser });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed to get Questions", got: false })
  }
})

app.post("/:name/submitAnswers", auth, async (req, res) => {
  const { answers } = req.body;
  try {
    const myid = answers.id;
    const Myexam = await exam.findOne({ _id: myid });
    const examname = Myexam.examName;
    const Noquestions = await question.find({ examName: examname });
    const Numberquestions = Noquestions.length;
    console.log("number of questions:", Numberquestions)
    const onlyAns = [];
    for (let i = 1; i <= Numberquestions; i++) {
      onlyAns.push(answers[i]);
    }
    const ans = {
      examWho: req.user.username,
      examName: examname,
      answersAll: onlyAns
    }
    const ans_reg = new answer(ans);
    await ans_reg.save();
    return res.json({ message: "Submitted Successfully", sub: true });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed to submit answers", sub: false });
  }
})

app.put("/:name/submitted", auth, async (req, res) => {
  const { name } = req.params;
  try {
    const Myexam = await exam.findOne({ _id: name });
    console.log("Hello: " + req.user);
    Myexam.submitted.push(req.user.userId);
    await Myexam.save();
    return res.json({ message: "successfully submitted the exam", sub: true });
  } catch (err) {
    console.log(err);
    return res.json({ message: "failed to submit the exam", sub: false });
  }
});

app.get("/:name/getAnswers", auth, async (req, res) => {
  const { name } = req.params;
  try {
    const puser = req.user.username;
    const allAnswers = await answer.findOne({ examName: name, examWho: puser });
    return res.json({ message: "got all answers", answersq: allAnswers, got: true })
  } catch (err) {
    console.log(err);
    return res.json({ message: "failed to fetch answers", got: false });
  }
})

app.post("/postAnalytics", auth, async (req, res) => {
  try {
    const { newana } = req.body;
    const exists = await analytic.findOne({ examId: newana.examId, examWho: newana.examWho });
    if (exists) {
      return res.json({ message: "already posted", posted: true });
    }
    const ana_reg = new analytic(newana);
    await ana_reg.save();
    return res.json({ message: "successfully posted analytics", posted: true });
  } catch (err) {
    console.log(err);
    return res.json({ message: "failed to post analytics", posted: false });
  }
})

app.get("/getAllAnalytics", auth, async (req, res) => {
  try {
    const puser = req.user.username;
    const allAnalytics = await analytic.find({ examWho: puser });
    if (allAnalytics) {
      return res.json({ message: "got all analytics", got: true, allana: allAnalytics });
    }
    return res.json({ message: "No analytics", got: false });
  } catch (err) {
    console.log(err);
    return res.json({ message: "failed to fetch analytics", got: false });
  }
})


app.get("/:exam/analytics/leaderboard", auth, async (req, res) => {
  const { exam } = req.params;
  try {
    const allAnalytics = await analytic.find({ examId: exam }).sort({ marks: -1 });
    if (allAnalytics) {
      return res.json({ message: "Succeessfully loaded leaderboard", got: true, leader: allAnalytics });
    }
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed to load leaderboard", got: false })
  }
})

app.get("/getProfile", auth, async (req, res) => {
  try {
    res.json({ message: "fetched profile", got: true, profile: req.user });
  } catch (err) {
    console.log(err);
    res.json({ message: "couldn't fetch profile", got: false })
  }
})
app.delete("/deleteOrganQuizes", auth, async (req, res) => {
  try {
    const puser = req.user?.username;
    if (!puser) {
      console.log("unauth");
      return res.status(401).json({ deleted: false, error: "Unauthorized" });
    }

    const result = await exam.deleteMany({ createdBy: puser });

    return res.status(200).json({ deleted: true, count: result.deletedCount });
  } catch (err) {
    console.error("Error deleting organized quizzes:", err);
    return res.status(500).json({ deleted: false, error: "Server Error" });
  }
});
app.delete("/deleteCreatedGroups", auth, async (req, res) => {
  try {
    const puser = req.user.username;
    await group.deleteMany({ createdBy: puser });
    return res.json({ deleted: true });
  } catch (err) {
    console.log(err);
    return res.json({ deleted: false });
  }
})
app.delete("/deleteAccount", auth, async (req, res) => {
  try {
    const puser = req.user.username;
    await analytic.deleteMany({ examWho: puser });
    await group.deleteMany({ createdBy: puser });
    await answer.deleteMany({ examWho: puser });
    await msgs.deleteMany({ sender: puser });
    await user.deleteMany({ username: puser });
    return res.json({ deleted: true });
  } catch (err) {
    console.log(err);
    return res.json({ deleted: false });
  }
})

app.get("/ping", (req, res) => {
  res.send("Backend is alive!");
});

server.listen("8000", () => {
  console.log("server is listening on port 8000");
})