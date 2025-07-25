// controllers/servoController.js

import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const ESP32_IP = process.env.ESP32_IP; // Example: http://192.168.137.52
let currentAngle = 0;

export const updateServoAngle = async (req, res) => {
  const { angle, userID } = req.body;

  // Validate input
  if (!Number.isInteger(angle) || !Number.isInteger(userID)) {
    return res.status(400).json({ error: 'Invalid input: angle and userID must be integers' });
  }

  try {
    // Send command to ESP32
    await axios.get(`${ESP32_IP}/servo/angle?angle=${angle}`);
    currentAngle = angle;

    // Get user info
    const [rows] = await pool.query('SELECT finger_id, first_name FROM users WHERE id = ?', [userID]);
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { finger_id, first_name } = rows[0];

    // Log to access_logs table
    await pool.query(
      'INSERT INTO access_logs (user_id, finger_id, action, method, status) VALUES (?, ?, ?, ?, ?)',
      [userID, finger_id, `Set servo angle to ${angle}`, 'REMOTE', 'granted']
    );

    res.json({
      success: true,
      message: `Servo angle set to ${angle} by ${first_name}`,
      angle,
    });
  } catch (error) {
    console.error('Error updating servo angle:', error.message);
    res.status(500).json({ error: 'Failed to update angle' });
  }
};

export const getServoStatus = (req, res) => {
  res.json({ angle: currentAngle });
};
