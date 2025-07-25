import pool from '../config/db.js';
import { format } from 'date-fns';
import { format as csvFormat } from 'fast-csv';
import { PassThrough } from 'stream';

export const getAccessHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let dateCondition = '';
    if (filter === 'today') {
      dateCondition = `AND DATE(al.created_at) = CURDATE()`;
    } else if (filter === 'week') {
      dateCondition = `AND YEARWEEK(al.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
    } else if (filter === 'month') {
      dateCondition = `AND YEAR(al.created_at) = YEAR(CURDATE()) AND MONTH(al.created_at) = MONTH(CURDATE())`;
    }

    const [history] = await pool.query(
      `
      SELECT 
        al.id,
        COALESCE(u.first_name, 'Unknown') AS first_name,
        al.action,
        al.method,
        al.created_at,
        al.status
      FROM 
        access_logs al
      LEFT JOIN 
        users u ON al.user_id = u.id
      WHERE 
        1=1 ${dateCondition}
      ORDER BY 
        al.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [parseInt(limit), parseInt(offset)]
    );

    const [total] = await pool.query(
      `
      SELECT 
        COUNT(*) AS count
      FROM 
        access_logs al
      WHERE 
        1=1 ${dateCondition}
      `
    );

    const totalPages = Math.ceil(total[0].count / limit);

    res.json({
      success: true,
      data: history,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching access history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access history'
    });
  }
};

export const exportAccessHistoryCSV = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;

    let dateCondition = '';
    if (filter === 'today') {
      dateCondition = `AND DATE(al.created_at) = CURDATE()`;
    } else if (filter === 'week') {
      dateCondition = `AND YEARWEEK(al.created_at, 1) = YEARWEEK(CURDATE(), 1)`;
    } else if (filter === 'month') {
      dateCondition = `AND YEAR(al.created_at) = YEAR(CURDATE()) AND MONTH(al.created_at) = MONTH(CURDATE())`;
    }

    const [rows] = await pool.query(
      `
      SELECT 
        al.id,
        COALESCE(u.first_name, 'Unknown') AS first_name,
        al.action,
        al.method,
        al.status,
        al.created_at
      FROM 
        access_logs al
      LEFT JOIN 
        users u ON al.user_id = u.id
      WHERE 1=1 ${dateCondition}
      ORDER BY al.created_at DESC
      `
    );

    // CSV headers
    const csvStream = csvFormat({ headers: true });
    const passthrough = new PassThrough();

    res.setHeader('Content-Disposition', 'attachment; filename="access_history.csv"');
    res.setHeader('Content-Type', 'text/csv');

    csvStream.pipe(passthrough).pipe(res);

    rows.forEach(row => {
      csvStream.write({
        ID: row.id,
        Name: row.first_name,
        Action: row.action,
        Method: row.method,
        Status: row.status,
        Timestamp: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')
      });
    });

    csvStream.end();
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};