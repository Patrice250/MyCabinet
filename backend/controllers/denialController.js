import pool from '../config/db.js';

// Get latest denials
export const getLatestDenials = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM access_logs 
      WHERE status = 'denied'
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch denials:', error);
    res.status(500).json({ error: 'Failed to fetch denials' });
  }
};
// Delete denial by ID
export const deleteDenialById = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM access_logs WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
