import group from "../models/groups.js";

export const deleteMaterial = async (req, res) => {
    const { groupId, materialId } = req.params;

    try {
        const pgroup = await group.findById(groupId);
        if (!pgroup) {
            return res.status(404).json({ message: "Group not found", deleted: false });
        }

        // Authorization Check
        // Note: Assuming req.user is populated by 'auth' middleware
        if (pgroup.createdBy !== req.user.username) {
            return res.status(403).json({ message: "Unauthorized: Only group creator can delete materials", deleted: false });
        }

        // Use MongoDB $pull to remove the item from the array
        const result = await group.updateOne(
            { _id: groupId },
            { $pull: { materials: { _id: materialId } } }
        );

        if (result.modifiedCount > 0) {
            return res.status(200).json({ message: "Material deleted successfully", deleted: true });
        } else {
            return res.status(404).json({ message: "Material not found", deleted: false });
        }

    } catch (err) {
        console.error("Error deleting material:", err);
        return res.status(500).json({ message: "Internal server error", deleted: false });
    }
};
