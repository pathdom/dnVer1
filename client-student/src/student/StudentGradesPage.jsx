import React from 'react';

export default function StudentGradesPage() {
  return (
    <section className="portal-page active">
      <div className="panel">
        <div className="panel-title">Bảng điểm theo học kỳ</div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div className="empty-state-title">Chưa có dữ liệu điểm</div>
          <div className="empty-state-sub">
            Kết quả học tập theo từng học kỳ sẽ được tư vấn viên và quản trị viên cập nhật tại đây khi hồ sơ của bạn có dữ liệu điểm.
          </div>
          <div className="semester-pill-row">
            <span className="stamp stamp-teal">Học kỳ 1</span>
            <span className="stamp stamp-teal">Học kỳ 2</span>
            <span className="stamp stamp-teal">Học kỳ 3</span>
          </div>
        </div>
      </div>
    </section>
  );
}
