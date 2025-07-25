import pool from '../config/db.js';
//import bcrypt from 'bcryptjs';

// ===============
// GET /api/finger/latest
// ===============
export const getLatestFinger = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT finger_id FROM users ORDER BY id DESC LIMIT 1'
    );
    if (rows.length === 0) {
      return res.json({ id: null });
    }
    return res.json({ id: rows[0].finger_id });
  } catch (err) {
    console.error("Error fetching latest finger:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===============
// GET /api/fingerprint/:id
// ===============
export const getUserByFingerID = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE finger_id = ?', [id]);
    if (rows.length === 0) {
      return res.json({ found: false });
    }

    const { password, ...dataWithoutPassword } = rows[0];
    return res.json({ found: true, data: { ...dataWithoutPassword, password } });
  } catch (err) {
    console.error("Error fetching user by fingerprint:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ===============
// POST /api/fingerprint/register
// ===============
export const registerFingerprint = async (req, res) => {
  const { finger_id, first_name, last_name, phone, password } = req.body;

  if (!finger_id || !first_name || !last_name || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE finger_id = ?', [finger_id]);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      await pool.query(
        `UPDATE users SET first_name = ?, last_name = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE finger_id = ?`,
        [first_name, last_name, phone, hashedPassword, finger_id]
      );
      return res.json({ exists: true });
    } else {
      await pool.query(
        `INSERT INTO users (finger_id, first_name, last_name, phone, password, is_active, is_admin) 
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [finger_id, first_name, last_name, phone, hashedPassword]
      );
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error("Error registering fingerprint:", err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// ===============
// GET /api/fingerprint/validate?id=7
// ===============
export const validateFingerprint = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing fingerprint ID" });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE finger_id = ?', [id]);
    if (rows.length === 0) {
      return res.json({ ok: false });
    }

    const user = rows[0];
    const fullName = `${user.first_name} ${user.last_name}`;
    return res.json({ ok: true, user: { id: user.id, name: fullName } });
  } catch (err) {
    console.error('Error validating fingerprint:', err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

// ===============
// POST /api/fingerprint-event
// Called by ESP32 to log every scan (granted or denied)
// ===============
export const logFingerprintEvent = async (req, res) => {
  const { fingerprintId, status } = req.body;

  try {
    let user_id = null;

    // Only look up user if the fingerprintId is valid (>= 0)
    if (fingerprintId !== undefined && fingerprintId >= 0) {
      const [rows] = await pool.query('SELECT id FROM users WHERE finger_id = ?', [fingerprintId]);
      if (rows.length > 0) {
        user_id = rows[0].id;
      }
    }

    const finger_id_value = fingerprintId >= 0 ? fingerprintId : null;

    // Insert both user_id and finger_id
    await pool.query(
      `INSERT INTO access_logs (user_id, finger_id, action, method, status)
       VALUES (?, ?, 'Fingerprint Scan', 'PHYSICAL', ?)`,
      [user_id, finger_id_value, status]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(" Failed to log fingerprint event:", err);
    res.status(500).json({ success: false, error: "DB insert failed" });
  }
};


// ===============
// GET /api/fingerprint/denials
// ===============
export const getLatestDenials = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM access_logs WHERE method = 'PHYSICAL' AND status = 'denied'
       ORDER BY created_at DESC LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching latest denials:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// ===============
// Utility: record a denial for unknown finger
// ===============
export const recordDenial = async (fingerID) => {
  try {
    await pool.query(
      `INSERT INTO access_logs (user_id, finger_id, action, method, status)
       VALUES (?, ?, ?, ?, ?)`,
      [null, fingerID, 'Fingerprint Scan', 'PHYSICAL', 'denied']
    );
  } catch (err) {
    console.error('Error recording denial:', err);
  }
};


