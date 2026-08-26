// One-time (idempotent) migration: creates thanh_toan (payments) so revenue
// can be reported by month/year instead of only as a lifetime running total.
// Run with: node server/migrations/setup_revenue.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS thanh_toan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hoc_vien_id INT NOT NULL,
      so_tien DECIMAL(15,2) NOT NULL,
      ngay_thanh_toan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ghi_chu VARCHAR(255) NULL,
      CONSTRAINT fk_thanh_toan_hoc_vien FOREIGN KEY (hoc_vien_id)
        REFERENCES hoc_vien(id) ON DELETE CASCADE,
      INDEX idx_thanh_toan_ngay (ngay_thanh_toan)
    )
  `);
  console.log('Ensured table thanh_toan');

  // Backfill: students that already have a paid amount but predate this table
  // get one payment row dated at their record's created_at (best guess), so
  // the revenue report isn't empty for data entered before this migration.
  const [rows] = await db.query(`
    SELECT hv.id, hv.tien_da_dong, hv.created_at
    FROM hoc_vien hv
    LEFT JOIN thanh_toan tt ON tt.hoc_vien_id = hv.id
    WHERE hv.tien_da_dong > 0 AND tt.id IS NULL
    GROUP BY hv.id
  `);
  for (const row of rows) {
    await db.query(
      'INSERT INTO thanh_toan (hoc_vien_id, so_tien, ngay_thanh_toan, ghi_chu) VALUES (?, ?, ?, ?)',
      [row.id, row.tien_da_dong, row.created_at || new Date(), 'Dữ liệu trước khi có báo cáo doanh thu']
    );
  }
  console.log(`Backfilled ${rows.length} existing student payment(s)`);

  console.log('Revenue migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
