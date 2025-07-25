import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Request password reset — verify phone exists
export const requestPasswordReset = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    return res.json({ message: 'Phone number verified. Proceed to reset password.' });
  } catch (error) {
    console.error('Error checking phone:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset password using phone number
export const resetPassword = async (req, res) => {
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword) {
    return res.status(400).json({ message: 'Phone and new password are required' });
  }

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE phone = ?', [
      hashedPassword,
      phone,
    ]);

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
