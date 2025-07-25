import express from 'express';
import { getAccessHistory } from '../controllers/historyController.js';
import { exportAccessHistoryCSV } from '../controllers/historyController.js';

const router = express.Router();

// GET /api/history
router.get('/history', getAccessHistory);
router.get('/history/export', exportAccessHistoryCSV);
export default router;