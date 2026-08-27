const DEPARTMENTS = [
  'Hành chính kế toán',
  'Marketing',
  'Đối ngoại',
  'Hồ sơ',
  'Đào tạo',
  'Kinh doanh'
];

function computeXepLoai(correct, total) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 85) return { label: 'Xuất sắc', tier: 'excellent' };
  if (pct >= 65) return { label: 'Đạt', tier: 'pass' };
  if (pct >= 50) return { label: 'Cần cải thiện', tier: 'needs-improvement' };
  return { label: 'Chưa đạt', tier: 'fail' };
}

module.exports = { DEPARTMENTS, computeXepLoai };
