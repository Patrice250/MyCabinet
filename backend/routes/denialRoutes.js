import express from 'express';
import { getLatestDenials, deleteDenialById } from '../controllers/denialController.js';

const router = express.Router();

router.get('/latest', getLatestDenials);
router.delete('/:id', deleteDenialById);

export default router;
