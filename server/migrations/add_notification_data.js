// One-time (idempotent) migration: adds du_lieu (JSON payload) to thong_bao so a
// broadcast notification can carry structured data (e.g. the process-flow the
// staff portal renders), not just display text.
// Run with: node server/migrations/add_notification_data.js
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
  if (!(await columnExists('thong_bao', 'du_lieu'))) {
    await db.query('ALTER TABLE thong_bao ADD COLUMN du_lieu LONGTEXT NULL');
    console.log('Added du_lieu to thong_bao');
  } else {
    console.log('thong_bao already has du_lieu');
  }
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
