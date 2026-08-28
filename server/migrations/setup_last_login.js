// One-time (idempotent) migration: adds last_login to the 3 auth tables so
// AccountsPage can show a real "Đăng nhập gần nhất" instead of fabricated data.
// Run with: node server/migrations/setup_last_login.js
const db = require('../db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function ensureLastLoginColumn(table) {
  if (!(await columnExists(table, 'last_login'))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN last_login TIMESTAMP NULL`);
    console.log(`Added last_login to ${table}`);
  } else {
    console.log(`${table} already has last_login`);
  }
}

(async () => {
  await ensureLastLoginColumn('tai_khoan_admin');
  await ensureLastLoginColumn('tai_khoan_nhan_vien');
  await ensureLastLoginColumn('tai_khoan_hoc_vien');
  console.log('last_login migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
