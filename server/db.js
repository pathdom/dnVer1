require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'quan_ly_trung_tam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công tới database [quan_ly_trung_tam]!');
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️ Cảnh báo kết nối MySQL:', error.message);
    console.warn('ℹ️ Hệ thống backend sẽ chạy với chế độ dữ liệu mẫu linh hoạt (mock fallback).');
    return false;
  }
}

testConnection();

module.exports = pool;
