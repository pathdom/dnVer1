// One-time (idempotent) migration: adapts the internal chat backend to the
// user's real DB tables (phong_chat / thanh_vien_phong_chat / tin_nhan),
// which only support nhan_vien (staff) participants. This adds nullable
// admin_id / admin_gui_id columns so admin can participate too, adds the
// message metadata columns the chat UI needs (reply, edit, delete, pin,
// file name/size), and creates small supplementary tables for features the
// real schema doesn't model (reactions, thread replies, saved messages).
// Run with: node server/migrations/setup_chat_v2.js
const db = require('../db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function addColumn(table, def) {
  const column = def.trim().split(/\s+/)[0];
  if (!(await columnExists(table, column))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${def}`);
    console.log(`Added ${column} to ${table}`);
  } else {
    console.log(`${table} already has ${column}`);
  }
}

(async () => {
  // thanh_vien_phong_chat: allow admin membership alongside staff
  await db.query(`ALTER TABLE thanh_vien_phong_chat MODIFY nhan_vien_id INT NULL`);
  await addColumn('thanh_vien_phong_chat', 'admin_id INT NULL AFTER nhan_vien_id');
  await addColumn('thanh_vien_phong_chat', 'pinned TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('thanh_vien_phong_chat', 'last_read_message_id INT NULL');
  console.log('thanh_vien_phong_chat ready');

  // tin_nhan: allow admin as sender, add message metadata the UI needs
  await db.query(`ALTER TABLE tin_nhan MODIFY nhan_vien_gui_id INT NULL`);
  await addColumn('tin_nhan', 'admin_gui_id INT NULL AFTER nhan_vien_gui_id');
  await addColumn('tin_nhan', 'reply_to_id INT NULL');
  await addColumn('tin_nhan', 'file_name VARCHAR(255) NULL');
  await addColumn('tin_nhan', 'file_size INT NULL');
  await addColumn('tin_nhan', 'edited TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('tin_nhan', 'deleted TINYINT(1) NOT NULL DEFAULT 0');
  await addColumn('tin_nhan', 'pinned TINYINT(1) NOT NULL DEFAULT 0');
  console.log('tin_nhan ready');

  // Supplementary tables (additive — features the real schema doesn't model)
  await db.query(`
    CREATE TABLE IF NOT EXISTS cam_xuc_tin_nhan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tin_nhan_id INT NOT NULL,
      nhan_vien_id INT NULL,
      admin_id INT NULL,
      emoji VARCHAR(16) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_cam_xuc_tin_nhan FOREIGN KEY (tin_nhan_id) REFERENCES tin_nhan(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table cam_xuc_tin_nhan');

  await db.query(`
    CREATE TABLE IF NOT EXISTS tra_loi_luong (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tin_nhan_goc_id INT NOT NULL,
      nhan_vien_id INT NULL,
      admin_id INT NULL,
      noi_dung TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tra_loi_luong FOREIGN KEY (tin_nhan_goc_id) REFERENCES tin_nhan(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table tra_loi_luong');

  await db.query(`
    CREATE TABLE IF NOT EXISTS tin_nhan_da_luu (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nhan_vien_id INT NULL,
      admin_id INT NULL,
      tin_nhan_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tin_nhan_da_luu FOREIGN KEY (tin_nhan_id) REFERENCES tin_nhan(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table tin_nhan_da_luu');

  console.log('Chat v2 migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
