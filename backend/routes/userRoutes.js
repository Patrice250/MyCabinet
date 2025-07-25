import express from 'express';
import {
  getUserByFingerId,
  getLatestFinger,
  registerUser,
  getUserByPhone,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Existing routes
router.get('/latest', getLatestFinger);
router.post('/register', registerUser);
router.get('/:id', getUserByFingerId);

// New routes
router.get('/phone/:phone', getUserByPhone);
router.put('/:finger_id', updateUser);
router.delete('/:finger_id', deleteUser);

export default router;