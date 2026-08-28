import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const GRADE_SKILLS = [
  { key: 'tuVung', label: 'Từ vựng' },
  { key: 'nguPhap', label: 'Ngữ pháp' },
  { key: 'hanTu', label: 'Hán tự' },
  { key: 'nghe', label: 'Nghe' },
  { key: 'hoiThoai', label: 'Hội thoại' }
];
const MONTHS = [1, 2, 3, 4, 5, 6];
const emptyGrades = () => ({ thang1: {}, thang2: {}, thang3: {}, thang4: {}, thang5: {}, thang6: {} });

export default function StaffStudentDetailPage({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState(emptyGrades());
  const [gradesLoading, setGradesLoading] = useState(true);
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradesMsg, setGradesMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/students/${studentId}`)
      .then(res => {
        if (!res.ok) throw new Error('Student not found');
        return res.json();
      })
      .then(data => { setStudent(data); setLoading(false); })
      .catch(err => { console.error('Lỗi tải chi tiết học viên:', err); setLoading(false); });
  }, [studentId]);

  useEffect(() => {
    if (!student) return;
    setGradesLoading(true);
    apiFetch(`/api/students/${student.id}/grades`)
      .then(res => res.json())
      .then(d => setGrades(d.grades || emptyGrades()))
      .catch(() => setGrades(emptyGrades()))
      .finally(() => setGradesLoading(false));
  }, [student?.id]);

  const handleGradeChange = (thang, key, value) => {
    setGrades(prev => ({ ...prev, [`thang${thang}`]: { ...prev[`thang${thang}`], [key]: value } }));
  };

  const handleSaveGrades = () => {
    setSavingGrades(true);
    setGradesMsg('');
    Promise.all(MONTHS.map(m =>
      apiFetch(`/api/students/${student.id}/grades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thang: m, grades: grades[`thang${m}`] })
      }).then(res => res.json())
    ))
      .then(results => {
        setSavingGrades(false);
        const err = results.find(r => r.error);
        if (err) { setGradesMsg('❌ ' + err.error); return; }
        setGradesMsg('✅ Đã lưu bảng điểm');
        setTimeout(() => setGradesMsg(''), 3000);
      })
      .catch(err => { setSavingGrades(false); setGradesMsg('❌ Lỗi kết nối máy chủ: ' + err.message); });
  };

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
        <button className="breadcrumb" onClick={onBack} style={{ cursor: 'pointer' }}>
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
      <button className="breadcrumb" onClick={onBack} style={{ cursor: 'pointer' }}>
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
          <button className="btn-primary" onClick={onBack}>✏️ Cập nhật CSDL</button>
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
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày nhập học</div><div style={{ fontWeight: '600' }}>{student.ngayNhapHoc || 'Chưa xếp'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày khởi tạo CSDL</div><div style={{ fontWeight: '600' }}>{student.joinedDate || student.createdAt || 'N/A'}</div></div>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📊 Bảng điểm học tập</h3>
              {gradesMsg && <span style={{ fontSize: '12.5px', fontWeight: 600, color: gradesMsg.startsWith('✅') ? 'var(--green)' : 'var(--coral)' }}>{gradesMsg}</span>}
            </div>
            {gradesLoading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Đang tải bảng điểm...</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-faint)', fontSize: '11.5px', textTransform: 'uppercase' }}>Kỹ năng</th>
                        {MONTHS.map(m => (
                          <th key={m} style={{ textAlign: 'center', padding: '8px', color: 'var(--text-faint)', fontSize: '11.5px', textTransform: 'uppercase' }}>Tháng {m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GRADE_SKILLS.map(skill => (
                        <tr key={skill.key}>
                          <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--navy)' }}>{skill.label}</td>
                          {MONTHS.map(m => (
                            <td key={m} style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <input
                                type="number" min="0" max="10" step="0.1"
                                value={grades[`thang${m}`]?.[skill.key] ?? ''}
                                onChange={(e) => handleGradeChange(m, skill.key, e.target.value)}
                                style={{ width: '56px', padding: '5px 6px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn-primary" onClick={handleSaveGrades} disabled={savingGrades} style={{ marginTop: '14px', width: '100%' }}>
                  {savingGrades ? 'Đang lưu...' : 'Lưu bảng điểm'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👩‍💼 Nhân viên phụ trách</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ width: '40px', height: '40px', background: 'var(--teal-soft)', color: 'var(--teal)', fontWeight: '700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {student.rep ? student.rep.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV'}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--navy)' }}>{student.rep || 'Chưa phân công'}</div>
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
                <span style={{ fontWeight: '700', color: 'var(--teal)' }}>{student.rep || 'Hệ thống'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{student.joinedDate || student.createdAt || ''}</span>
              </div>
              <div>Hồ sơ đã cập nhật CSDL MySQL. Xem chi tiết bên trên để nắm tình trạng hiện tại.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
