import express from "express";
import { deleteMaterial } from "../controllers/group.js";
import auth from "./auth.js"; // Reuse existing auth middleware

const router = express.Router();

// Delete a material from a group
// Route: /api/groups/:groupId/materials/:materialId
router.delete("/:groupId/materials/:materialId", auth, deleteMaterial);

export default router;
