import exam from '../models/exam.js';
import group from '../models/groups.js';
import question from '../models/Questions.js';
import answer from '../models/answers.js';
import user from '../models/user.js';

export const getExamMaterials = async (req, res) => {
    const { examId } = req.params;
    try {
        const currentExam = await exam.findById(examId);
        if (!currentExam) {
            return res.status(404).json({ message: "Exam not found", fetched: false });
        }

        const groupIds = currentExam.groups;
        const examGroups = await group.find({ _id: { $in: groupIds } });

        let allMaterials = [];
        examGroups.forEach(grp => {
            if (grp.materials && grp.materials.length > 0) {
                const materialsWithGroup = grp.materials.map(mat => ({
                    ...mat.toObject(),
                    groupName: grp.groupName,
                    groupId: grp._id
                }));
                allMaterials = [...allMaterials, ...materialsWithGroup];
            }
        });

        return res.status(200).json({
            message: "Fetched all materials",
            fetched: true,
            materials: allMaterials
        });

    } catch (err) {
        console.error("Error fetching exam materials:", err);
        return res.status(500).json({ message: "Failed to fetch materials", fetched: false });
    }
};

export const getExam = async (req, res) => {
    const { examId } = req.params;
    try {
        const currentExam = await exam.findById(examId);
        if (!currentExam) {
            return res.status(404).json({ message: "Exam not found", fetched: false });
        }
        return res.status(200).json({
            message: "Fetched exam",
            fetched: true,
            exam: currentExam
        });
    } catch (err) {
        console.error("Error fetching exam:", err);
        return res.status(500).json({ message: "Failed to fetch exam", fetched: false });
    }
};

export const createExam = async (req, res) => {
    const { groups, examName, duration, linear } = req.body;
    const un = req.user.username;
    try {
        const newExam = new exam({
            examName: examName,
            createdBy: un,
            groups: groups,
            duration: duration,
            linearity: linear
        });
        const owner = await user.findOne({ username: un });
        await newExam.save();
        return res.json({ message: "success", owner: owner, newExam: newExam });
    } catch (err) {
        console.log(err);
        return res.json({ message: "failure" });
    }
};

export const addQuestion = async (req, res) => {
    // const { exam } = req.params; // parameter 'exam' is not used, only payload
    const { payload } = req.body;
    try {
        const filter = { examName: payload.examName, questionNo: payload.questionNo };
        const update = { ...payload };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        await question.findOneAndUpdate(filter, update, options);

        return res.json({ message: "Successfully saved question", created: true });
    } catch (err) {
        console.log(err);
        return res.json({ message: "Failed to save", created: false });
    }
};

export const getUserExams = async (req, res) => {
    const { username } = req.params;
    try {
        const hisGroups = await group.find({
            $or: [
                { members: username },
                { createdBy: username }
            ]
        });
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
};

export const startExam = async (req, res) => {
    const { id } = req.params;
    const pexam = await exam.findOne({ _id: id });

    if (!pexam) return res.json({ message: "exam not found", set: false });

    const currentUser = req.user.username;

    const userTimer = pexam.endTime.find(entry => entry.user === currentUser);

    if (userTimer) {
        if (userTimer.time) {
            return res.json({ message: "you already started your exam", set: false, end: userTimer.time });
        }
    }

    const newEndTime = new Date(Date.now() + pexam.duration * 60 * 1000);

    pexam.endTime.push({ user: currentUser, time: newEndTime });
    await pexam.save();

    return res.json({ message: "Exam is started", end: newEndTime, set: true });
};

export const getExamQuestions = async (req, res) => {
    const { id } = req.params;
    try {
        const Myexam = await exam.findOne({ _id: id });
        if (!Myexam) {
            return res.json({ message: "No exam found", got: false });
        }
        const allQuestions = await question.find({ examName: Myexam._id }).sort({ questionNo: 1 });
        const puser = req.user;

        let userEndTime = null;
        if (Myexam.endTime && Array.isArray(Myexam.endTime)) {
            const found = Myexam.endTime.find(e => e.user === puser.username);
            if (found) userEndTime = found.time;
        }

        const examDataToSend = Myexam.toObject();
        examDataToSend.endTime = userEndTime;

        return res.json({ message: "Got all the questions", questions: allQuestions, got: true, Nowexam: examDataToSend, puser: puser });
    } catch (err) {
        console.log(err);
        return res.json({ message: "Failed to get Questions", got: false });
    }
};

export const submitAnswers = async (req, res) => {
    const { answers } = req.body;
    try {
        const myid = answers.id;
        const Myexam = await exam.findOne({ _id: myid });
        const examname = Myexam.examName;
        const examid = Myexam._id;
        const Noquestions = await question.find({ examName: examid });
        const Numberquestions = Noquestions.length;
        console.log("number of questions:", Numberquestions);
        const onlyAns = [];
        for (let i = 1; i <= Numberquestions; i++) {
            onlyAns.push(answers[i]);
        }
        const ans = {
            examWho: req.user.username,
            examName: examname,
            answersAll: onlyAns
        };
        const ans_reg = new answer(ans);
        await ans_reg.save();
        return res.json({ message: "Submitted Successfully", sub: true });
    } catch (err) {
        console.log(err);
        return res.json({ message: "Failed to submit answers", sub: false });
    }
};

export const finishExam = async (req, res) => {
    const { id } = req.params;
    try {
        const Myexam = await exam.findOne({ _id: id });
        console.log("Hello: " + req.user);
        Myexam.submitted.push(req.user.userId);
        await Myexam.save();
        return res.json({ message: "successfully submitted the exam", sub: true });
    } catch (err) {
        console.log(err);
        return res.json({ message: "failed to submit the exam", sub: false });
    }
};

export const getExamAnswers = async (req, res) => {
    const { id } = req.params; // Changed from 'name' to 'id' for consistency if router uses :id
    // But wait, the route was /:name/getAnswers and name is usually ID or examName?
    // In app.js: app.get("/:name/getAnswers") -> allAnswers = await answer.findOne({ examName: name... })
    // Wait, in submitAnswers, ans.examName was saved as 'examname' (string name) NOT ID?
    // Let's recheck submitAnswers logic:
    // const Myexam = await exam.findOne({ _id: myid }); const examname = Myexam.examName;
    // So 'answer' model uses examName STRING as key? That's fragile but I must follow it.
    // However, the route usage: `/${examInfo.examName}/getAnswers` in Analytics.jsx confirms it uses NAME.
    // So the parameter really is NAME.
    // But I will strive to use IDs where possible, but if the schema relies on Name, I must use Name.
    // Let's keep it as is from app.js logic but rename param to fit context.
    const { name } = req.params;
    try {
        const puser = req.user.username;
        const allAnswers = await answer.findOne({ examName: name, examWho: puser });
        return res.json({ message: "got all answers", answersq: allAnswers, got: true });
    } catch (err) {
        console.log(err);
        return res.json({ message: "failed to fetch answers", got: false });
    }
};
