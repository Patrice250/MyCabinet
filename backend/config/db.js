import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced pool configuration with keep-alive
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Pool event listeners
pool.on('connection', (connection) => {
  console.log(`[DB] New connection (ID: ${connection.threadId})`);
});

pool.on('acquire', (connection) => {
  console.log(`[DB] Connection acquired (ID: ${connection.threadId})`);
});

pool.on('release', (connection) => {
  console.log(`[DB] Connection released (ID: ${connection.threadId})`);
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
});

/**
 * Verifies database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function verifyConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[DB] Connection verification failed:', err);
    return false;
  }
}

/**
 * Gracefully closes the connection pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('[DB] Connection pool closed');
  } catch (err) {
    console.error('[DB] Error closing pool:', err);
  }
}

export default pool;