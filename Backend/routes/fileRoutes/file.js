import express from "express";
import { generatePresignedUrl, generatePresignedUrlClass, generateViewUrl } from "../../controllers/uploadController.js";

const router = express.Router();
router.post("/presigned-url", generatePresignedUrl);
router.post("/presigned-url-class", generatePresignedUrlClass);
router.post("/view-presigned-url", generateViewUrl);
export default router;
