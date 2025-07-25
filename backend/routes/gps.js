import express from 'express';
import { 
  insertGPS, 
  getLatestGPS, 
  handleAlert,
  getSafeZoneSettings,
  updateSafeZoneSettings
} from '../controllers/gpsController.js';

const router = express.Router();

// GPS Data Endpoints
router.get('/location', getLatestGPS);
router.post('/location', insertGPS);
router.post('/alert', handleAlert);

// Safe Zone Configuration Endpoints
router.get('/settings', getSafeZoneSettings);
router.post('/settings', updateSafeZoneSettings);

export default router;