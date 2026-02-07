import express from 'express';
import { getProfile, deleteOrganizedExams, deleteCreatedGroups, deleteAccount } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.delete('/organized-exams', auth, deleteOrganizedExams);
router.delete('/created-groups', auth, deleteCreatedGroups);
router.delete('/account', auth, deleteAccount);

export default router;
