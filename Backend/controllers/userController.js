import user from '../models/user.js';
import exam from '../models/exam.js';
import group from '../models/groups.js';
import analytic from '../models/analytics.js';
import answer from '../models/answers.js';
import msgs from '../models/messages.js';

export const getProfile = async (req, res) => {
    try {
        res.json({ message: "fetched profile", got: true, profile: req.user });
    } catch (err) {
        console.log(err);
        res.json({ message: "couldn't fetch profile", got: false });
    }
};

export const deleteOrganizedExams = async (req, res) => {
    try {
        const puser = req.user?.username;
        if (!puser) {
            return res.status(401).json({ deleted: false, error: "Unauthorized" });
        }

        const result = await exam.deleteMany({ createdBy: puser });

        return res.status(200).json({ deleted: true, count: result.deletedCount });
    } catch (err) {
        console.error("Error deleting organized quizzes:", err);
        return res.status(500).json({ deleted: false, error: "Server Error" });
    }
};

export const deleteCreatedGroups = async (req, res) => {
    try {
        const puser = req.user.username;
        await group.deleteMany({ createdBy: puser });
        return res.json({ deleted: true });
    } catch (err) {
        console.log(err);
        return res.json({ deleted: false });
    }
};

export const deleteAccount = async (req, res) => {
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
};
