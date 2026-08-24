// One-time (idempotent) migration: adds password_hash to hoc_vien/nhan_vien,
// backfills default passwords, and re-hashes the admin table's plaintext passwords.
// Run with: node server/migrations/setup_auth.js
const bcrypt = require('bcryptjs');
const db = require('../db');

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;
const STUDENT_DEFAULT_PASSWORD = 'Student@2026';
const STAFF_DEFAULT_PASSWORD = 'Staff@2026';

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function ensurePasswordColumn(table) {
  if (!(await columnExists(table, 'password_hash'))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN password_hash VARCHAR(255) NULL AFTER email`);
    console.log(`Added password_hash to ${table}`);
  }
}

async function backfillDefaultPasswords(table, defaultPassword) {
  const [rows] = await db.query(`SELECT id FROM \`${table}\` WHERE password_hash IS NULL`);
  for (const row of rows) {
    const hash = await bcrypt.hash(defaultPassword, 10);
    await db.query(`UPDATE \`${table}\` SET password_hash = ? WHERE id = ?`, [hash, row.id]);
  }
  console.log(`Backfilled ${rows.length} rows in ${table} with default password`);
}

async function rehashPlaintextAdminPasswords() {
  const [rows] = await db.query('SELECT id, password_hash FROM admin');
  let count = 0;
  for (const row of rows) {
    if (row.password_hash && !BCRYPT_HASH_RE.test(row.password_hash)) {
      const hash = await bcrypt.hash(row.password_hash, 10);
      await db.query('UPDATE admin SET password_hash = ? WHERE id = ?', [hash, row.id]);
      console.log(`Re-hashed plaintext password for admin id=${row.id}`);
      count++;
    }
  }
  if (count === 0) console.log('No plaintext admin passwords found');
}

(async () => {
  await ensurePasswordColumn('hoc_vien');
  await ensurePasswordColumn('nhan_vien');
  await backfillDefaultPasswords('hoc_vien', STUDENT_DEFAULT_PASSWORD);
  await backfillDefaultPasswords('nhan_vien', STAFF_DEFAULT_PASSWORD);
  await rehashPlaintextAdminPasswords();
  console.log('Auth migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
