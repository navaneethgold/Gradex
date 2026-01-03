import express from "express";
import { generatePresignedUrl } from "../../controllers/uploadController.js";

const router = express.Router();
router.post("/presigned-url", generatePresignedUrl);
export default router;
