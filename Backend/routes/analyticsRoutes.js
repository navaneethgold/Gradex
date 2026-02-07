import express from 'express';
import { createAnalytics, getUserAnalytics, getLeaderboard } from '../controllers/analyticsController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', auth, createAnalytics);
router.get('/all', auth, getUserAnalytics);
router.get('/:examId/leaderboard', auth, getLeaderboard);

export default router;
