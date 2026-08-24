const db = require('./db');

async function removeTestHV() {
  try {
    await db.query("DELETE FROM hoc_vien WHERE ma_hoc_vien NOT IN ('HV001', 'HV002')");
    console.log('✅ Dọn dẹp xong!');
    await db.end();
  } catch (err) {
    console.error(err);
  }
}

removeTestHV();
