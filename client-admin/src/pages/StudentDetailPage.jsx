import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

export default function StudentDetailPage({ studentId, setCurrentPage }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const targetId = studentId || 'HV001';
    apiFetch(`/api/students/${targetId}`)
      .then(res => {
        if (!res.ok) throw new Error('Student not found');
        return res.json();
      })
      .then(data => {
        setStudent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student detail:', err);
        // Fallback: Lấy danh sách và chọn học viên đầu tiên
        apiFetch('/api/students')
          .then(res => res.json())
          .then(d => {
            if (d.students && d.students.length > 0) {
              setStudent(d.students[0]);
            } else {
              setStudent({
                id: 'HV001',
                name: 'Nguyễn Văn An',
                email: 'an.nguyen@aladdin.vn',
                phone: '0912345678',
                hometown: 'Nghệ An',
                country: 'Nhật Bản',
                statusText: 'Đang học tiếng',
                program: 'Hồ sơ du học',
                ngayNhapHoc: '01/09/2026',
                avatar: 'AN',
                tienDaDongFormatted: '30.000.000 ₫',
                tongTienFormatted: '120.000.000 ₫',
                joinedDate: '21/08/2026'
              });
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [studentId]);

  if (loading) {
    return (
      <section className="page active" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow)', display: 'inline-block' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div style={{ fontWeight: '600', color: 'var(--navy)' }}>Đang tải thông tin chi tiết học viên từ CSDL...</div>
        </div>
      </section>
    );
  }

  if (!student) {
    return (
      <section className="page active" style={{ padding: '40px' }}>
        <button className="breadcrumb" onClick={() => setCurrentPage('students')}>
          ← Quay lại danh sách học viên
        </button>
        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '16px' }}>
          Không tìm thấy thông tin học viên.
        </div>
      </section>
    );
  }

  return (
    <section className="page active">
      <button className="breadcrumb" onClick={() => setCurrentPage('students')} style={{ cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Quay lại danh sách học viên
      </button>

      <div className="profile-header" style={{ marginTop: '12px' }}>
        <div className="profile-header-left">
          <div className="avatar profile-avatar">{student.avatar || 'HV'}</div>
          <div>
            <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="profile-name" style={{ fontSize: '22px', fontWeight: '700' }}>{student.name}</span>
              <span className="stamp stamp-teal">{student.statusText || 'Đang học tiếng'}</span>
            </div>
            <div className="profile-meta" style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-soft)' }}>
              <span>📋 Mã {student.id}</span>
              <span>📞 {student.phone || 'Chưa có SĐT'}</span>
              <span>✉️ {student.email || 'Chưa có email'}</span>
              <span>✈️ Du học {student.country || 'Nhật Bản'}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => setCurrentPage('internalchat')}>💬 Nhắn tin</button>
          <button className="btn-primary" onClick={() => setCurrentPage('students')}>✏️ Cập nhật CSDL</button>
        </div>
      </div>

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👤 Thông tin cá nhân & Quê quán</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Họ và tên</div><div style={{ fontWeight: '600' }}>{student.name}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Quê quán</div><div style={{ fontWeight: '600' }}>{student.hometown || 'Chưa cập nhật'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số điện thoại</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{student.phone || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Email</div><div style={{ fontWeight: '600' }}>{student.email || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số CCCD/Hộ chiếu</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{student.passport || 'P0123456'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Trường THPT</div><div style={{ fontWeight: '600' }}>{student.school || 'THPT Chu Văn An'}</div></div>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>✈️ Hồ sơ du học & Học phí CSDL</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Quốc gia đến</div><div style={{ fontWeight: '700', color: 'var(--teal)' }}>✈️ {student.country}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Trạng thái hồ sơ</div><div style={{ fontWeight: '600' }}>{student.statusText}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Tiền đã đóng</div><div style={{ fontWeight: '700', color: 'var(--green)', fontSize: '15px' }}>{student.tienDaDongFormatted || '0 ₫'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Tổng học phí</div><div style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '15px' }}>{student.tongTienFormatted || '0 ₫'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày nhập học</div><div style={{ fontWeight: '600' }}>{student.ngayNhapHoc || '01/09/2026'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày khởi tạo CSDL</div><div style={{ fontWeight: '600' }}>{student.joinedDate || '21/08/2026'}</div></div>
            </div>
          </div>
        </div>

        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👩‍💼 Nhân viên phụ trách</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ width: '40px', height: '40px', background: 'var(--teal-soft)', color: 'var(--teal)', fontWeight: '700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TH</div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--navy)' }}>{student.rep || 'Lê Thu Hà'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Chuyên viên tư vấn & xử lý hồ sơ</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📌 Ghi chú nội bộ</h3>
            </div>
            <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '700', color: 'var(--teal)' }}>Lê Thu Hà</span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{student.joinedDate || '21/08/2026'}</span>
              </div>
              <div>Hồ sơ đã cập nhật CSDL MySQL. Học viên chuẩn bị nhập học kỳ Thu 2026.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
