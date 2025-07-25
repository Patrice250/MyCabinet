import pool from '../config/db.js';

export const getWeeklyAccessStats = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DAYNAME(created_at) AS day,
        method,
        status,
        COUNT(*) AS count
      FROM access_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY day, method, status
    `);

    // Structure days in order
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const methods = ['Physical', 'Remote'];
    const statuses = ['granted', 'denied'];

    const result = weekDays.map((day) => {
      const dayData = { day };
      methods.forEach((method) => {
        statuses.forEach((status) => {
          const match = rows.find(
            (r) => r.day === day && r.method === method && r.status === status
          );
          dayData[`${method}_${status}`] = match ? match.count : 0;
        });
      });
      return dayData;
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
