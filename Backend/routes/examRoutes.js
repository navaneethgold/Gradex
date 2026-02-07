import express from 'express';
import {
    getExamMaterials,
    getExam,
    createExam,
    addQuestion,
    getUserExams,
    startExam,
    getExamQuestions,
    submitAnswers,
    finishExam,
    getExamAnswers
} from '../controllers/examController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:examId/materials', auth, getExamMaterials);
router.get('/:examId', auth, getExam);
router.get('/user/:username', auth, getUserExams); // Added auth here as per plan
router.post('/create', auth, createExam);
router.post('/:id/questions', auth, addQuestion); // :id is exam ID
router.put('/:id/start', auth, startExam);
router.get('/:id/questions', auth, getExamQuestions);
router.post('/:id/submit', auth, submitAnswers);
router.put('/:id/finish', auth, finishExam);
router.get('/:name/answers', auth, getExamAnswers); // Uses exam name

export default router;
