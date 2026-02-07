import group from "../models/groups.js";
import user from "../models/user.js";
import msgs from "../models/messages.js";
import { spawn } from 'child_process';
import path from 'path';

export const createGroup = async (req, res) => {
    const { groupName } = req.body;
    try {
        const puser = req.user.username;
        const grpExists = await group.findOne({ groupName: groupName, createdBy: puser });
        if (grpExists) return res.json({ message: "Group already exists", created: false });
        const new_grp = {
            groupName: groupName,
            createdBy: puser
        };
        const registered_grp = new group(new_grp);
        await registered_grp.save();
        return res.status(200).json({ message: "Group created Successfully", created: true });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Failed to create a group", created: false });
    }
};

export const getAllGroups = async (req, res) => {
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
                role.push("Participant");
            }
        }
        return res.status(200).json({ message: "Fetched all groups", fetched: true, allg: allGroups, roles: role });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: "Failed to fetch groups", fetched: false });
    }
};

export const getAdminGroups = async (req, res) => {
    try {
        const allGroups = await group.find({ createdBy: req.user.username });
        return res.status(200).json({ message: "Fetched all groups", fetched: true, allg: allGroups });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: "Failed to fetch groups", fetched: false });
    }
};

export const getGroupById = async (req, res) => {
    const { id } = req.params;
    try {
        const grou = await group.findOne({ _id: id });
        return res.status(200).json({ message: "Successfully fetched", fetched: true, grp: grou });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: "failed to fetch", fetched: false });
    }
};

export const addMember = async (req, res) => {
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

        if (pgroup.createdBy !== req.user.username) {
            return res.status(403).json({ message: "Only group creator can add members.", added: false });
        }

        const puser = await user.findOne({ email });
        if (!puser) {
            return res.status(404).json({ message: "No user found with this email.", added: false });
        }

        if (pgroup.members.includes(puser.username)) {
            return res.status(400).json({ message: "User is already a member of this group.", added: false });
        }

        pgroup.members.push(puser.username);
        await pgroup.save();

        return res.status(200).json({ message: "Member added successfully.", added: true });
    } catch (error) {
        console.error("Error adding member:", error);
        return res.status(500).json({ message: "Internal server error.", added: false });
    }
};

export const removeMember = async (req, res) => {
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
};

export const addMaterial = async (req, res) => {
    const { id } = req.params;
    const { title, link, file } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Title is required", added: false });
    }

    try {
        const pgroup = await group.findById(id);
        if (!pgroup) return res.status(404).json({ message: "Group not found", added: false });

        if (pgroup.createdBy !== req.user.username) {
            return res.status(403).json({ message: "Unauthorized", added: false });
        }
        pgroup.materials.push({
            title,
            link,
            file,
            uploadedAt: new Date()
        });

        await pgroup.save();

        if (file && (file.endsWith('.pdf') || file.includes('materials'))) {
            console.log("Triggering PDF Processing Pipeline for:", file);

            const pdfScript = path.join(process.cwd(), 'scripts', 'pdfOperations.py');
            const vecScript = path.join(process.cwd(), 'scripts', 'vectorOperations.py');

            const pdfProc = spawn('python', [pdfScript, file]);
            const vecProc = spawn('python', [vecScript]);

            pdfProc.stdout.pipe(vecProc.stdin);

            pdfProc.stderr.on('data', (data) => console.error(`PDF Script Error: ${data}`));
            vecProc.stderr.on('data', (data) => console.error(`Vector Script Error: ${data}`));

            vecProc.on('close', (code) => {
                if (code === 0) {
                    console.log("Vector Processing Complete Successfully.");
                } else {
                    console.error(`Vector Processing failed with code ${code}`);
                }
            });
        }

        return res.status(200).json({ message: "Material added and processing started", added: true });

    } catch (err) {
        console.error("Add material error:", err);
        return res.status(500).json({ message: "Failed to add material", added: false });
    }
};

export const deleteMaterial = async (req, res) => {
    const { groupId, materialId } = req.params;

    try {
        const pgroup = await group.findById(groupId);
        if (!pgroup) {
            return res.status(404).json({ message: "Group not found", deleted: false });
        }

        if (pgroup.createdBy !== req.user.username) {
            return res.status(403).json({ message: "Unauthorized: Only group creator can delete materials", deleted: false });
        }

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

export const getGroupChat = async (req, res) => {
    const { id } = req.params;
    try {
        const allMsgs = await msgs.find({ roomId: id }).sort({ time: 1 });
        const puser = req.user;
        return res.json({ fetched: true, message: allMsgs, puser: puser });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ fetched: false, message: "failed to fetch chat" });
    }
};

export const addGroupMessage = async (req, res) => {
    const { newtxt2 } = req.body;
    try {
        const newtxt3 = new msgs(newtxt2);
        await newtxt3.save();
        res.status(200).json({ message: "Message sent" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to send message" });
    }
};
