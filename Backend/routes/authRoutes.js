import express from 'express';
import { signUp, login, checkLogin } from '../controllers/authController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/check-login', auth, checkLogin);

export default router;
