import React, { useEffect, useState } from 'react';

export default function StudentDetailPage({ studentId, setCurrentPage }) {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetch(`/api/students/${studentId || 'HV-2451'}`)
      .then(res => res.json())
      .then(data => setStudent(data))
      .catch(err => console.error(err));
  }, [studentId]);

  if (!student) return <div className="page active">Đang tải thông tin học viên...</div>;

  return (
    <section className="page active">
      <button className="breadcrumb" onClick={() => setCurrentPage('students')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Quay lại danh sách học viên
      </button>

      <div className="profile-header">
        <div className="profile-header-left">
          <div className="avatar profile-avatar">{student.avatar}</div>
          <div>
            <div className="profile-name-row">
              <span className="profile-name">{student.name}</span>
              <span className="stamp stamp-visa">{student.statusText}</span>
            </div>
            <div className="profile-meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Mã {student.id}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>{student.phone || '0912 345 678'}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>{student.email || 'lananh.nguyen@email.com'}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Tham gia {student.joinedDate || '02/2026'}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn-ghost" onClick={() => setCurrentPage('internalchat')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>Nhắn tin</button>
          <button className="btn-ghost"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Gọi điện</button>
          <button className="btn-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Chỉnh sửa hồ sơ</button>
        </div>
      </div>

      <div className="grid-2col">
        <div className="col-stack">
          <div className="panel">
            <div className="panel-head"><h3>Thông tin cá nhân</h3></div>
            <div className="info-grid">
              <div className="info-item"><div className="info-label">Ngày sinh</div><div className="info-value">{student.dob || '14/03/2005'}</div></div>
              <div className="info-item"><div className="info-label">Giới tính</div><div class="info-value">{student.gender || 'Nữ'}</div></div>
              <div className="info-item"><div className="info-label">Số CCCD/Hộ chiếu</div><div className="info-value">{student.passport || 'P0123456'}</div></div>
              <div className="info-item"><div className="info-label">Trường THPT</div><div className="info-value">{student.school || 'THPT Chu Văn An, Hà Nội'}</div></div>
              <div className="info-item"><div className="info-label">Địa chỉ</div><div className="info-value">{student.address || 'Q. Tây Hồ, Hà Nội'}</div></div>
              <div className="info-item"><div className="info-label">Phụ huynh liên hệ</div><div className="info-value">{student.parentContact || 'Nguyễn Văn Hải (Bố) — 0908 111 222'}</div></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Hồ sơ du học</h3></div>
            <div className="info-grid">
              <div className="info-item"><div className="info-label">Bậc học</div><div className="info-value">Cử nhân</div></div>
              <div className="info-item"><div className="info-label">Ngành học</div><div className="info-value">{student.program}</div></div>
              <div className="info-item"><div className="info-label">Trường đăng ký</div><div className="info-value">{student.targetSchool || 'Boston University'}</div></div>
              <div className="info-item"><div className="info-label">Học kỳ nhập học</div><div className="info-value">{student.intake || 'Thu 2027 (09/2027)'}</div></div>
              <div className="info-item"><div className="info-label">Chứng chỉ tiếng Anh</div><div className="info-value">{student.english || 'IELTS 7.0'}</div></div>
              <div className="info-item"><div className="info-label">Ngân sách dự kiến</div><div className="info-value">{student.budget || '1.2 tỷ ₫ / năm'}</div></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Tiến trình xử lý hồ sơ</h3></div>
            <div className="stepper">
              {(student.steps || [
                { num: 1, title: 'Tiếp nhận', date: '10/02', done: true },
                { num: 2, title: 'Tư vấn', date: '18/02', done: true },
                { num: 3, title: 'Nộp hồ sơ', date: '02/05', done: true },
                { num: 4, title: 'Phỏng vấn Visa', date: '20/07', done: true },
                { num: 5, title: 'Đã có Visa', date: '12/08', current: true },
                { num: 6, title: 'Lên đường', date: 'Dự kiến 08/2027', done: false }
              ]).map((step, idx) => (
                <div key={idx} className={`step ${step.done ? 'done' : ''} ${step.current ? 'current' : ''}`}>
                  <div className="step-line"></div>
                  <div className="step-circle">{step.done ? '✓' : step.num}</div>
                  <div className="step-label">{step.title}</div>
                  <div className="step-date">{step.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-stack">
          <div className="rep-card">
            <div className="rep-top">
              <div className="avatar">TK</div>
              <div>
                <div className="rep-name">{student.rep || 'Trần Minh Khoa'}</div>
                <div className="rep-role">Tư vấn viên phụ trách</div>
              </div>
            </div>
            <div className="rep-contact-row">
              <button className="btn-ghost"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Gọi</button>
              <button className="btn-ghost" onClick={() => setCurrentPage('internalchat')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>Nhắn</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Tài liệu đính kèm</h3>
              <span className="link">+ Tải lên</span>
            </div>
            <div className="doc-list">
              {(student.documents || [
                { name: 'Hộ chiếu.pdf', date: '12/08/2026', statusText: 'Đã duyệt' },
                { name: 'Bảng điểm THPT.pdf', date: '03/05/2026', statusText: 'Đã duyệt' }
              ]).map((doc, i) => (
                <div className="doc-row" key={i}>
                  <div className="doc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
                  <div className="doc-info"><div className="doc-name">{doc.name}</div><div className="doc-sub">Cập nhật {doc.date}</div></div>
                  <span className="stamp stamp-visa" style={{ transform: 'none', padding: '3px 8px', fontSize: '9.5px' }}>{doc.statusText}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Lịch sử tư vấn</h3></div>
            <div className="mini-timeline">
              {(student.consultHistory || [
                { title: 'Tư vấn chọn trường & ngành học', date: '18/02/2026 · Trần Minh Khoa' },
                { title: 'Luyện phỏng vấn Visa', date: '15/07/2026 · Trần Minh Khoa' }
              ]).map((item, idx) => (
                <div className="mini-timeline-item" key={idx}>
                  <div className="mini-timeline-dot-col"><div className="mini-timeline-dot"></div><div className="mini-timeline-track"></div></div>
                  <div className="mini-timeline-content"><div className="mini-timeline-title">{item.title}</div><div className="mini-timeline-date">{item.date}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Ghi chú nội bộ</h3></div>
            {(student.notes || [
              { author: 'Trần Minh Khoa', date: '12/08/2026', content: 'Học viên đã nhận Visa F-1, đang chờ lịch xác nhận nhập học và đặt vé máy bay.' }
            ]).map((note, idx) => (
              <div className="note-card" key={idx}>
                <div className="note-head"><span className="note-author">{note.author}</span><span className="note-date">{note.date}</span></div>
                <div className="note-text">{note.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
