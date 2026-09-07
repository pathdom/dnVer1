// One-time (idempotent) migration: mỗi nhân viên chỉ được làm 1 lần / 1 đề thi.
// MySQL coi nhiều dòng NULL trong unique key là khác nhau, nên các dòng kết quả
// nhập tay (bo_de_thi_id NULL) không bị ảnh hưởng bởi ràng buộc này.
// Run with: node server/migrations/setup_exam_attempt_unique.js
const db = require('../db');

async function indexExists(table, indexName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows[0].cnt > 0;
}

(async () => {
  if (!(await indexExists('test_nang_luc', 'uniq_attempt_per_exam'))) {
    await db.query(
      'ALTER TABLE test_nang_luc ADD UNIQUE KEY uniq_attempt_per_exam (nhan_vien_id, bo_de_thi_id)'
    );
    console.log('Added uniq_attempt_per_exam to test_nang_luc');
  } else {
    console.log('test_nang_luc already has uniq_attempt_per_exam');
  }
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
