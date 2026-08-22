const mysql = require('mysql2/promise');

// Cấu hình thông tin kết nối
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'mmm1108',
    database: 'quan_ly_trung_tam',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Tạo Connection Pool (tối ưu hiệu năng khi nhiều API cùng gọi)
const pool = mysql.createPool(dbConfig);

// Hàm kiểm tra trạng thái kết nối
async function kiemTraKetNoi() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công tới database [quan_ly_trung_tam]!');
        connection.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
    }
}

kiemTraKetNoi();

module.exports = pool;