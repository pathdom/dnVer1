import React from 'react';

export default function StudentProfilePage({ profile }) {
  const p = profile || {
    name: 'Nguyễn Thị Lan Anh',
    id: 'HV-2451',
    dob: '14/03/2005',
    passport: 'P0123456',
    email: 'lananh.nguyen@email.com',
    phone: '0912 345 678',
    school: 'Boston University',
    degree: 'Cử nhân',
    program: 'Quản trị Kinh doanh',
    intake: 'Thu 2027 (09/2027)',
    english: 'IELTS 7.0',
    advisor: 'Trần Minh Khoa'
  };

  return (
    <section className="portal-page active">
      <div className="page-title-row">
        <div>
          <h1>Hồ sơ du học của tôi</h1>
          <p>Thông tin cá nhân, chương trình học và tiến độ xử lý hồ sơ.</p>
        </div>
      </div>

      <div className="grid-2col">
        <div className="col-stack">
          <div className="panel">
            <div className="panel-head"><h3>Thông tin cá nhân</h3></div>
            <div className="info-grid">
              <div className="info-item"><div className="info-label">Họ và tên</div><div className="info-value">{p.name}</div></div>
              <div className="info-item"><div className="info-label">Mã học viên</div><div className="info-value">{p.id}</div></div>
              <div className="info-item"><div className="info-label">Ngày sinh</div><div className="info-value">{p.dob}</div></div>
              <div className="info-item"><div className="info-label">Số hộ chiếu</div><div className="info-value">{p.passport}</div></div>
              <div className="info-item"><div className="info-label">Email</div><div className="info-value">{p.email}</div></div>
              <div className="info-item"><div className="info-label">Số điện thoại</div><div className="info-value">{p.phone}</div></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Chương trình đăng ký</h3></div>
            <div className="info-grid">
              <div className="info-item"><div className="info-label">Trường</div><div className="info-value">{p.school}</div></div>
              <div className="info-item"><div className="info-label">Bậc học</div><div className="info-value">{p.degree}</div></div>
              <div className="info-item"><div className="info-label">Ngành học</div><div className="info-value">{p.program}</div></div>
              <div className="info-item"><div className="info-label">Học kỳ nhập học</div><div className="info-value">{p.intake}</div></div>
              <div className="info-item"><div className="info-label">Chứng chỉ tiếng Anh</div><div className="info-value">{p.english}</div></div>
              <div className="info-item"><div className="info-label">Tư vấn viên phụ trách</div><div className="info-value">{p.advisor}</div></div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Tiến độ hồ sơ</h3></div>
          <div className="stepper">
            <div className="step done"><div className="step-line"></div><div className="step-circle">✓</div><div className="step-label">Tiếp nhận</div></div>
            <div className="step done"><div className="step-line"></div><div className="step-circle">✓</div><div className="step-label">Tư vấn</div></div>
            <div className="step done"><div className="step-line"></div><div className="step-circle">✓</div><div className="step-label">Nộp hồ sơ</div></div>
            <div className="step current"><div className="step-line"></div><div className="step-circle">4</div><div className="step-label">Visa</div></div>
            <div className="step"><div className="step-line"></div><div className="step-circle">5</div><div className="step-label">Lên đường</div></div>
          </div>
          <div className="stage-list">
            <div className="stage-row">
              <div className="stage-check done">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <div className="stage-title">Nộp hồ sơ thành công</div>
                <div className="stage-desc">Hoàn tất ngày 02/05/2026, đã được trường xác nhận tiếp nhận.</div>
              </div>
            </div>
            <div className="stage-row">
              <div className="stage-check done">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <div className="stage-title">Phỏng vấn Visa thành công</div>
                <div className="stage-desc">Hoàn tất ngày 20/07/2026, kết quả: được cấp Visa F-1.</div>
              </div>
            </div>
            <div className="stage-row">
              <div className="stage-check current">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/></svg>
              </div>
              <div>
                <div className="stage-title">Chờ xác nhận nhập học</div>
                <div className="stage-desc">Đang chờ trường gửi thư xác nhận chính thức, dự kiến trước 01/09/2026.</div>
              </div>
            </div>
            <div className="stage-row">
              <div className="stage-check todo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/></svg>
              </div>
              <div>
                <div className="stage-title">Chuẩn bị lên đường</div>
                <div className="stage-desc">Đặt vé máy bay, sắp xếp chỗ ở và tham gia buổi định hướng trước khi bay.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
