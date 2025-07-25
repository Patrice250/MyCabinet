
import express from 'express';
import { updateServoAngle, getServoStatus } from '../controllers/servoController.js';

const router = express.Router();

router.get('/servo/status', getServoStatus);
router.post('/servo/angle', updateServoAngle);
router.post('/angle', updateServoAngle);
router.get('/status', getServoStatus);

export default router;

