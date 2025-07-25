import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is admin
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Additional check for admin user
    if (user.id === 1 && !user.is_logged_in) {
      return res.status(401).json({
        success: false,
        message: 'Admin session expired'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized' 
    });
  }
};

export default authenticate;