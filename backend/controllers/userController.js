import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getUserByFingerId = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid fingerprint ID' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE finger_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserByPhone = async (req, res) => {
  const { phone } = req.params;
  
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return password hash
    const { password, ...userData } = rows[0];
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLatestFinger = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT finger_id FROM users ORDER BY finger_id DESC LIMIT 1'
    );
    res.json({ id: rows[0]?.finger_id || null });
  } catch (error) {
    console.error('Error fetching latest fingerprint:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { finger_id, first_name, last_name, phone, password } = req.body;

    if (!finger_id || !first_name || !last_name || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (isNaN(finger_id)) {
      return res.status(400).json({ message: 'Fingerprint ID must be a number' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await pool.query(
      'SELECT * FROM users WHERE finger_id = ? OR phone = ?',
      [finger_id, phone]
    );
    
    if (existing.length > 0) {
      const conflict = existing.some(u => u.finger_id == finger_id) ? 
        'Fingerprint already registered' : 'Phone number already registered';
      return res.status(409).json({ message: conflict });
    }

    await pool.query(
      'INSERT INTO users (finger_id, first_name, last_name, phone, password) VALUES (?, ?, ?, ?, ?)',
      [finger_id, first_name, last_name, phone, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { finger_id } = req.params;
    const { first_name, last_name, phone, password } = req.body;

    if (!finger_id || isNaN(finger_id)) {
      return res.status(400).json({ message: 'Invalid fingerprint ID' });
    }

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ message: 'All fields except password are required' });
    }

    // Check if phone is being used by another user
    const [phoneCheck] = await pool.query(
      'SELECT finger_id FROM users WHERE phone = ? AND finger_id != ?',
      [phone, finger_id]
    );
    
    if (phoneCheck.length > 0) {
      return res.status(409).json({ message: 'Phone number already registered to another user' });
    }

    let updateQuery = 'UPDATE users SET first_name = ?, last_name = ?, phone = ?';
    let queryParams = [first_name, last_name, phone];

    // Only update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE finger_id = ?';
    queryParams.push(finger_id);

    const [result] = await pool.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Server error during update:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { finger_id } = req.params;

    if (!finger_id || isNaN(finger_id)) {
      return res.status(400).json({ message: 'Invalid fingerprint ID' });
    }

    const [result] = await pool.query(
      'DELETE FROM users WHERE finger_id = ?',
      [finger_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Server error during deletion:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};