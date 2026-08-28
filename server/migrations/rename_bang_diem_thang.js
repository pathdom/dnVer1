// One-time (idempotent) migration: bảng điểm chuyển từ 3 học kỳ sang 6 tháng —
// đổi tên cột hoc_ky -> thang (giữ nguyên kiểu TINYINT, ràng buộc UNIQUE tự theo tên cột mới).
// Run with: node server/migrations/rename_bang_diem_thang.js
const db = require('../db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

(async () => {
  const hasOld = await columnExists('bang_diem', 'hoc_ky');
  const hasNew = await columnExists('bang_diem', 'thang');
  if (hasOld && !hasNew) {
    await db.query('ALTER TABLE bang_diem CHANGE COLUMN hoc_ky thang TINYINT NOT NULL');
    console.log('Renamed bang_diem.hoc_ky -> thang');
  } else {
    console.log('bang_diem.thang already in place');
  }
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
