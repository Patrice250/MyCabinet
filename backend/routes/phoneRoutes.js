// routes/phoneRoutes.js
import express from 'express';
import { getPhoneStatus } from '../controllers/phoneController.js';

const router = express.Router();

// GET /api/phone-status
router.get('/phone-status', getPhoneStatus);

export default router;
