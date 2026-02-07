import express from "express";
import {
    createGroup,
    getAllGroups,
    getAdminGroups,
    getGroupById,
    addMember,
    removeMember,
    addMaterial,
    deleteMaterial,
    getGroupChat,
    addGroupMessage
} from "../controllers/groupController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", auth, createGroup);
router.get("/all", auth, getAllGroups);
router.get("/admin", auth, getAdminGroups);
router.get("/:id", auth, getGroupById);
router.put("/:id/members", auth, addMember);
// Using POST for adding member is more RESTful if treating 'members' as a resource collection, but staying consistent with PUT for update or POST
// Implementation Plan said PUT /:id/members
router.delete("/:id/members", auth, removeMember);
router.post("/:id/materials", auth, addMaterial);
router.delete("/:groupId/materials/:materialId", auth, deleteMaterial);
router.get("/:id/chat", auth, getGroupChat);
router.post("/:id/chat", auth, addGroupMessage);

export default router;
