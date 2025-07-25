import express from 'express';
import {
  getLatestFinger,
  getUserByFingerID,
  registerFingerprint,
  getLatestDenials,
  recordDenial,
  validateFingerprint,     
  logFingerprintEvent      
} from '../controllers/fingerprintController.js';


const router = express.Router();

router.get('/finger/latest', getLatestFinger);
router.get('/fingerprint/:id', getUserByFingerID);
router.post('/fingerprint/register', registerFingerprint);
router.get('/fingerprint/validate', validateFingerprint);
router.post('/fingerprint-event', logFingerprintEvent);

export default router;
