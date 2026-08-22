import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(d => setEmployees(d.employees))
      .catch(err => console.error(err));
  }, []);

  const getDeptTagStyle = (dept) => {
    switch (dept) {
      case 'Tư vấn tuyển sinh': return { background: 'var(--teal-soft)', color: 'var(--teal)' };
      case 'Xử lý hồ sơ': return { background: '#E7EEFC', color: '#3B6FD1' };
      case 'Marketing': return { background: 'var(--gold-soft)', color: 'var(--gold)' };
      case 'Kế toán': return { background: 'var(--coral-soft)', color: 'var(--coral)' };
      default: return { background: 'var(--teal-soft)', color: 'var(--teal)' };
    }
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${employees.length} nhân sự`}
        title="Quản lý nhân viên"
        subtitle="Thông tin phòng ban, khối lượng công việc và trạng thái làm việc."
        rightAction={
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm nhân viên
          </button>
        }
      />

      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card"><div className="stat-value">22</div><div className="stat-label">Tổng nhân viên</div></div>
        <div className="stat-card"><div className="stat-value">9</div><div className="stat-label">Phòng tư vấn tuyển sinh</div></div>
        <div className="stat-card"><div className="stat-value">6</div><div className="stat-label">Phòng xử lý hồ sơ</div></div>
        <div className="stat-card"><div className="stat-value">2</div><div className="stat-label">Vị trí đang tuyển</div></div>
      </div>

      <div className="emp-grid">
        {employees.map((emp) => (
          <div className="emp-card" key={emp.id}>
            <div className="emp-top">
              <div className="avatar emp-avatar">{emp.avatar}</div>
              <div>
                <div className="emp-name">{emp.name}</div>
                <div className="emp-role">{emp.role}</div>
              </div>
            </div>
            <span className="dept-tag" style={getDeptTagStyle(emp.dept)}>{emp.dept}</span>
            <div className="emp-meta-row">
              <div className="emp-meta-item">
                <div className="num">{emp.studentCount}</div>
                <div className="lbl">Học viên</div>
              </div>
              <span className={`stamp ${emp.status === 'leave' ? 'stamp-leave' : 'stamp-active'}`}>{emp.statusText}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
