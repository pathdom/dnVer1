import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function StudentsPage({ setCurrentPage, setSelectedStudentId }) {
  const [students, setStudents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(d => setStudents(d.students))
      .catch(err => console.error(err));
  }, []);

  const getStampClass = (status) => {
    switch (status) {
      case 'visa': return 'stamp stamp-visa';
      case 'processing': return 'stamp stamp-processing';
      case 'new': return 'stamp stamp-new';
      case 'submitted': return 'stamp stamp-submitted';
      case 'hold': return 'stamp stamp-hold';
      default: return 'stamp stamp-new';
    }
  };

  const filteredStudents = students.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${students.length} hồ sơ`}
        title="Quản lý học viên"
        subtitle="Theo dõi hồ sơ, quốc gia và tiến độ visa của toàn bộ học viên."
        rightAction={
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm học viên
          </button>
        }
      />

      <div className="filter-bar">
        <div className={`chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          Tất cả ({students.length})
        </div>
        <div className={`chip ${filterStatus === 'processing' ? 'active' : ''}`} onClick={() => setFilterStatus('processing')}>
          Đang tư vấn ({students.filter(s => s.status === 'processing').length})
        </div>
        <div className={`chip ${filterStatus === 'submitted' ? 'active' : ''}`} onClick={() => setFilterStatus('submitted')}>
          Đã nộp hồ sơ ({students.filter(s => s.status === 'submitted').length})
        </div>
        <div className={`chip ${filterStatus === 'visa' ? 'active' : ''}`} onClick={() => setFilterStatus('visa')}>
          Đã có visa ({students.filter(s => s.status === 'visa').length})
        </div>
        <div className={`chip ${filterStatus === 'hold' ? 'active' : ''}`} onClick={() => setFilterStatus('hold')}>
          Tạm hoãn ({students.filter(s => s.status === 'hold').length})
        </div>

        <div className="filter-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Tìm theo tên, mã HV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <table className="table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Chương trình</th>
                <th>Quốc gia</th>
                <th>Nhân viên phụ trách</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="avatar">{s.avatar}</div>
                      <div>
                        <div className="cell-name">{s.name}</div>
                        <div className="cell-sub">Mã {s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.program}</td>
                  <td>{s.country}</td>
                  <td>{s.rep}</td>
                  <td><span className={getStampClass(s.status)}>{s.statusText}</span></td>
                  <td>{s.updatedAt}</td>
                  <td>
                    <button
                      className="row-action"
                      title="Xem chi tiết"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setCurrentPage('student-detail');
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
