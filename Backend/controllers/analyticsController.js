import analytic from '../models/analytics.js';

export const createAnalytics = async (req, res) => {
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
};

export const getUserAnalytics = async (req, res) => {
    try {
        const puser = req.user.username;
        const allAnalytics = await analytic.find({ examWho: puser });
        if (allAnalytics && allAnalytics.length > 0) {
            return res.json({ message: "got all analytics", got: true, allana: allAnalytics });
        }
        return res.json({ message: "No analytics", got: false });
    } catch (err) {
        console.log(err);
        return res.json({ message: "failed to fetch analytics", got: false });
    }
};

export const getLeaderboard = async (req, res) => {
    const { examId } = req.params;
    try {
        const allAnalytics = await analytic.find({ examId: examId }).sort({ marks: -1 });
        if (allAnalytics) {
            return res.json({ message: "Successfully loaded leaderboard", got: true, leader: allAnalytics });
        }
        return res.json({ message: "No leaderboard data", got: false });
    } catch (err) {
        console.log(err);
        return res.json({ message: "Failed to load leaderboard", got: false });
    }
};
