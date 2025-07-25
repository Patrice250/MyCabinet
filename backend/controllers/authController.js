import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    await logFailedLogin(phone, 'Missing credentials');
    return res.status(400).json({ 
      success: false,
      message: 'Phone and password are required' 
    });
  }

  try {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      await logFailedLogin(phone, 'Invalid phone');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid phone or password' 
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      await logFailedLogin(phone, 'Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid phone or password' 
      });
    }


    // 3. Check if admin is already logged in (only for admin user)
    if (user.id === 1 && user.is_logged_in) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is already in use. Only one session allowed.'
      });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Update login status for admin
    if (user.id === 1) {
      await pool.execute(
        'UPDATE users SET is_logged_in = 1 WHERE id = ?',
        [user.id]
      );
    }

    // 6. Remove password from response
    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

const logFailedLogin = async (phone, reason) => {
  try {
    await pool.execute(
      `INSERT INTO access_logs 
      (action, method, status) 
      VALUES (?, 'Remote', 'denied')`,
      [`Failed login attempt for phone: ${phone} (${reason})`]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Reset login status for admin user
    await pool.execute(
      'UPDATE users SET is_logged_in = 0 WHERE id = ? AND is_admin = 1',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};