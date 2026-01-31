import express from 'express';
import { getExamMaterials, getExam } from '../controllers/examController.js';
import auth from '../routes/auth.js'; // Assuming auth middleware is in routes/auth.js

const router = express.Router();

router.get('/:examId/materials', auth, getExamMaterials);
router.get('/:examId', auth, getExam);

export default router;
