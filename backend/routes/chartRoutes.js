import express from 'express';
import { getWeeklyAccessStats } from '../controllers/chartController.js';

const router = express.Router();

router.get('/weekly-access-stats', getWeeklyAccessStats);

export default router;
