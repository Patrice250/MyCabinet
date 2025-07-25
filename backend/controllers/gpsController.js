import pool from '../config/db.js';

export const insertGPS = async (req, res) => {
  const { latitude, longitude, is_alert = 0 } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    await pool.query(
      `INSERT INTO gps_data (latitude, longitude, is_alert) VALUES (?, ?, ?)`,
      [latitude, longitude, is_alert]
    );
    
    if (req.app.get('io')) {
      req.app.get('io').emit('gps_update', { 
        latitude, 
        longitude,
        timestamp: new Date(),
        is_alert
      });
    }
    
    return res.status(201).json({ message: 'GPS data inserted successfully' });
  } catch (error) {
    console.error('Error inserting GPS data:', error);
    return res.status(500).json({ error: 'Server error while saving GPS data' });
  }
};

export const getLatestGPS = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT latitude, longitude, timestamp, is_alert 
       FROM gps_data 
       ORDER BY id DESC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        latitude: 0,
        longitude: 0,
        timestamp: new Date(),
        is_alert: 0
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    return res.status(500).json({ 
      latitude: 0,
      longitude: 0,
      timestamp: new Date(),
      is_alert: 0,
      error: 'Server error while fetching GPS data' 
    });
  }
};

export const handleAlert = async (req, res) => {
  const { latitude, longitude, timestamp, deviceId, message } = req.body;

  try {
    await pool.query(
      `INSERT INTO gps_data (latitude, longitude, is_alert) VALUES (?, ?, ?)`,
      [latitude, longitude, 1]
    );

    await pool.query(
      `INSERT INTO alerts (device_id, latitude, longitude, message) VALUES (?, ?, ?, ?)`,
      [deviceId, latitude, longitude, message]
    );

    if (req.app.get('io')) {
      req.app.get('io').emit('alert', {
        deviceId,
        latitude,
        longitude,
        timestamp,
        message
      });
    }

    return res.status(201).json({ message: 'Alert processed' });
  } catch (error) {
    console.error('Error processing alert:', error);
    return res.status(500).json({ error: 'Failed to process alert' });
  }
};

export const getSafeZoneSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM safe_zone_settings LIMIT 1');
    res.json(rows[0] || { 
      safe_zone_radius: 0.05, 
      gps_drift_threshold: 0.01 
    });
  } catch (error) {
    console.error('Error fetching safe zone settings:', error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

export const updateSafeZoneSettings = async (req, res) => {
  const { safe_zone_radius, gps_drift_threshold } = req.body;

  try {
    await pool.query(`
      INSERT INTO safe_zone_settings 
        (safe_zone_radius, gps_drift_threshold) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        safe_zone_radius = VALUES(safe_zone_radius),
        gps_drift_threshold = VALUES(gps_drift_threshold)
    `, [safe_zone_radius, gps_drift_threshold]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating safe zone settings:', error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};