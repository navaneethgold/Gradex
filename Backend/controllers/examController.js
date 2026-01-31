import exam from '../models/exam.js';
import group from '../models/groups.js';

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
                // Add group context to materials if needed, or just flatten
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
