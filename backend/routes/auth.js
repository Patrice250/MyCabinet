import express from 'express';
import { login, logout } from '../controllers/authController.js';
import authenticate from '../controllers/authenticate.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

export default router;