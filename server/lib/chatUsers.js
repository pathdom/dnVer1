// Resolves chat participants (role + id from the JWT) to display info by
// querying the existing admin/nhan_vien tables — chat has no user table of its own.
const db = require('../db');

function initialsOf(name, fallback) {
  if (!name) return fallback;
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

async function getUser(role, id) {
  if (role === 'admin') {
    const [rows] = await db.query('SELECT id, username, ho_ten FROM admin WHERE id = ?', [id]);
    const a = rows[0];
    if (!a) return null;
    const name = a.ho_ten || a.username;
    return { role: 'admin', id: a.id, name, roleLabel: 'Quản trị', initials: initialsOf(name, 'AD') };
  }
  if (role === 'staff') {
    const [rows] = await db.query('SELECT id, ho_ten, chuc_danh, bo_phan FROM nhan_vien WHERE id = ?', [id]);
    const s = rows[0];
    if (!s) return null;
    return { role: 'staff', id: s.id, name: s.ho_ten, roleLabel: s.chuc_danh || s.bo_phan || 'Nhân viên', initials: initialsOf(s.ho_ten, 'NV') };
  }
  return null;
}

async function listPeople(excludeRole, excludeId) {
  const [admins] = await db.query('SELECT id, username, ho_ten FROM admin');
  const [staffs] = await db.query("SELECT id, ho_ten, chuc_danh, bo_phan FROM nhan_vien WHERE trang_thai = 'Đang làm việc' OR trang_thai IS NULL");
  const people = [
    ...admins.map(a => ({
      role: 'admin', id: a.id, name: a.ho_ten || a.username, roleLabel: 'Quản trị',
      department: 'Ban quản trị', initials: initialsOf(a.ho_ten || a.username, 'AD')
    })),
    ...staffs.map(s => ({
      role: 'staff', id: s.id, name: s.ho_ten, roleLabel: s.chuc_danh || s.bo_phan || 'Nhân viên',
      department: s.bo_phan || 'Khác', initials: initialsOf(s.ho_ten, 'NV')
    }))
  ];
  return people.filter(p => !(p.role === excludeRole && p.id === excludeId));
}

module.exports = { getUser, listPeople, initialsOf };
