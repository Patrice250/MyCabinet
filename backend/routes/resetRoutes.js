import express from 'express';
import {
  requestPasswordReset,
  resetPassword,
} from '../controllers/resetController.js';

const router = express.Router();

// POST: /api/reset/request
router.post('/request', requestPasswordReset);

// POST: /api/reset/confirm
router.post('/confirm', resetPassword);

export default router;
