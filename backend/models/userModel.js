import db from '../config/db.js';

export const createUser = (user, callback) => {
  const sql = 'INSERT INTO users (finger_id, first_name, last_name, phone, password) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [user.finger_id, user.first_name, user.last_name, user.phone, user.password], callback);
};

export const findUserByPhone = (phone, callback) => {
  const sql = 'SELECT * FROM users WHERE phone = ?';
  db.query(sql, [phone], callback);
};
