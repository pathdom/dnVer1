// One-time (idempotent) migration: adds avatar_url to admin/nhan_vien so users
// can upload a profile picture instead of showing text initials.
// Run with: node server/migrations/setup_avatar.js
const db = require('../db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function ensureAvatarColumn(table) {
  if (!(await columnExists(table, 'avatar_url'))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN avatar_url VARCHAR(255) NULL`);
    console.log(`Added avatar_url to ${table}`);
  } else {
    console.log(`${table} already has avatar_url`);
  }
}

(async () => {
  await ensureAvatarColumn('admin');
  await ensureAvatarColumn('nhan_vien');
  console.log('Avatar migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
