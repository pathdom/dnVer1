// Resolves chat participants (role + id from the JWT) to display info by
// querying the existing admin/nhan_vien tables — chat has no user table of its own.
const db = require('../db');

function initialsOf(name, fallback) {
  if (!name) return fallback;
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

async function getUser(role, id) {
  if (role === 'admin') {
    const [rows] = await db.query('SELECT id, username, ho_ten, avatar_url FROM tai_khoan_admin WHERE id = ?', [id]);
    const a = rows[0];
    if (!a) return null;
    const name = a.ho_ten || a.username;
    return { role: 'admin', id: a.id, name, roleLabel: 'Quản trị', initials: initialsOf(name, 'AD'), avatarUrl: a.avatar_url || null };
  }
  if (role === 'staff') {
    const [rows] = await db.query(`
      SELECT nv.id, nv.ho_ten, cd.ten_chuc_danh, bp.ten_bo_phan, nv.avatar_url
      FROM nhan_vien nv
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      WHERE nv.id = ?
    `, [id]);
    const s = rows[0];
    if (!s) return null;
    return { role: 'staff', id: s.id, name: s.ho_ten, roleLabel: s.ten_chuc_danh || s.ten_bo_phan || 'Nhân viên', initials: initialsOf(s.ho_ten, 'NV'), avatarUrl: s.avatar_url || null };
  }
  return null;
}

async function listPeople(excludeRole, excludeId) {
  const [admins] = await db.query('SELECT id, username, ho_ten, avatar_url FROM tai_khoan_admin');
  const [staffs] = await db.query(`
    SELECT nv.id, nv.ho_ten, cd.ten_chuc_danh, bp.ten_bo_phan, nv.avatar_url
    FROM nhan_vien nv
    LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
    LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
    WHERE nv.trang_thai = 'Đang làm việc' OR nv.trang_thai IS NULL
  `);
  const people = [
    ...admins.map(a => ({
      role: 'admin', id: a.id, name: a.ho_ten || a.username, roleLabel: 'Quản trị',
      department: 'Ban quản trị', initials: initialsOf(a.ho_ten || a.username, 'AD'), avatarUrl: a.avatar_url || null
    })),
    ...staffs.map(s => ({
      role: 'staff', id: s.id, name: s.ho_ten, roleLabel: s.ten_chuc_danh || s.ten_bo_phan || 'Nhân viên',
      department: s.ten_bo_phan || 'Khác', initials: initialsOf(s.ho_ten, 'NV'), avatarUrl: s.avatar_url || null
    }))
  ];
  return people.filter(p => !(p.role === excludeRole && p.id === excludeId));
}

module.exports = { getUser, listPeople, initialsOf };
