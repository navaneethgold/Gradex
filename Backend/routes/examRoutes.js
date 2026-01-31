import express from 'express';
import { getExamMaterials } from '../controllers/examController.js';
import auth from '../routes/auth.js'; // Assuming auth middleware is in routes/auth.js

const router = express.Router();

router.get('/:examId/materials', auth, getExamMaterials);

export default router;
