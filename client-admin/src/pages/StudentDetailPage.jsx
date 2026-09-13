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

export default function StudentDetailPage({ studentId, setCurrentPage }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState(emptyGrades());
  const [gradesLoading, setGradesLoading] = useState(true);
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradesMsg, setGradesMsg] = useState('');
  const [personalProfile, setPersonalProfile] = useState(null);
  const [personalFamily, setPersonalFamily] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(true);

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

  useEffect(() => {
    if (!student) return;
    setGradesLoading(true);
    apiFetch(`/api/students/${student.id}/grades`)
      .then(res => res.json())
      .then(d => setGrades(d.grades || emptyGrades()))
      .catch(() => setGrades(emptyGrades()))
      .finally(() => setGradesLoading(false));
  }, [student?.id]);

  useEffect(() => {
    if (!student) return;
    setPersonalLoading(true);
    apiFetch(`/api/students/${student.id}/personal-profile`)
      .then(res => res.json())
      .then(d => {
        setPersonalProfile(d.profile || null);
        setPersonalFamily(d.family || []);
      })
      .catch(() => { setPersonalProfile(null); setPersonalFamily([]); })
      .finally(() => setPersonalLoading(false));
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
              <span>Du học {student.country || 'Nhật Bản'}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => setCurrentPage('internalchat')}>💬 Nhắn tin</button>
          <button className="btn-primary" onClick={() => setCurrentPage('students')}>✏️ Cập nhật CSDL</button>
        </div>
      </div>

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px', alignItems: 'stretch' }}>
        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👤 Thông tin cá nhân & Quê quán</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Họ và tên</div><div style={{ fontWeight: '600' }}>{student.name}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày sinh</div><div style={{ fontWeight: '600' }}>{student.dob || 'Chưa cập nhật'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Quê quán</div><div style={{ fontWeight: '600' }}>{student.hometown || 'Chưa cập nhật'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số điện thoại</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{student.phone || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Email</div><div style={{ fontWeight: '600' }}>{student.email || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số CCCD/Hộ chiếu</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{student.passport || 'P0123456'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Trường THPT</div><div style={{ fontWeight: '600' }}>{student.school || 'THPT Chu Văn An'}</div></div>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>Hồ sơ du học & Học phí CSDL</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Quốc gia đến</div><div style={{ fontWeight: '700', color: 'var(--teal)' }}>{student.country}</div></div>
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

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
      </div>

      <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginTop: '20px' }}>
        <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📋 Hồ sơ cá nhân (học viên tự khai)</h3>
        </div>

        {personalLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Đang tải hồ sơ cá nhân...</div>
        ) : !personalProfile ? (
          <p style={{ fontSize: '13.5px', color: 'var(--text-faint)' }}>Học viên chưa điền hồ sơ cá nhân.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Thông tin cá nhân</div>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số CCCD</div><div style={{ fontWeight: '600' }}>{personalProfile.so_cccd || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày cấp</div><div style={{ fontWeight: '600' }}>{personalProfile.ngay_cap_cccd || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Giới tính</div><div style={{ fontWeight: '600' }}>{personalProfile.gioi_tinh || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Tôn giáo</div><div style={{ fontWeight: '600' }}>{personalProfile.ton_giao || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Dân tộc</div><div style={{ fontWeight: '600' }}>{personalProfile.dan_toc || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Tình trạng hôn nhân</div><div style={{ fontWeight: '600' }}>{personalProfile.tinh_trang_hon_nhan || 'Chưa cập nhật'}</div></div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Nơi cư trú & Liên hệ</div>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Hộ khẩu thường trú</div><div style={{ fontWeight: '600' }}>{personalProfile.ho_khau_thuong_tru || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Nơi tạm trú</div><div style={{ fontWeight: '600' }}>{personalProfile.noi_tam_tru || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>SĐT người thân</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{personalProfile.sdt_nguoi_than || 'Chưa cập nhật'}</div></div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Quá trình học tập</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px' }}>Bậc học</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px' }}>Trường</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px' }}>Từ năm</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px' }}>Đến năm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Tiểu học', truong: personalProfile.truong_tieu_hoc, tu: personalProfile.tieu_hoc_tu, den: personalProfile.tieu_hoc_den },
                      { label: 'Trung học', truong: personalProfile.truong_trung_hoc, tu: personalProfile.trung_hoc_tu, den: personalProfile.trung_hoc_den },
                      { label: 'THPT', truong: personalProfile.truong_thpt, tu: personalProfile.thpt_tu, den: personalProfile.thpt_den },
                      { label: 'Cao đẳng/Đại học', truong: personalProfile.truong_cd_dh, tu: personalProfile.cd_dh_tu, den: personalProfile.cd_dh_den }
                    ].map(row => (
                      <tr key={row.label} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>{row.label}</td>
                        <td style={{ padding: '8px 12px' }}>{row.truong || 'Chưa cập nhật'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{row.tu || '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{row.den || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Lịch sử làm việc</div>
              <p style={{ fontSize: '13.5px', margin: 0 }}>{personalProfile.lich_su_lam_viec || 'Chưa cập nhật'}</p>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Thông tin gia đình</div>
              {personalFamily.length === 0 ? (
                <p style={{ fontSize: '13.5px', color: 'var(--text-faint)', margin: 0 }}>Chưa có thông tin.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Quan hệ</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Họ tên</th>
                        <th style={{ textAlign: 'center', padding: '8px 12px' }}>Năm sinh</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Nghề nghiệp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personalFamily.map(m => (
                        <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{m.quan_he}</td>
                          <td style={{ padding: '8px 12px' }}>{m.ho_ten}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{m.nam_sinh || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{m.nghe_nghiep || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Bản thân</div>
              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Điểm mạnh</div><div style={{ fontWeight: '600' }}>{personalProfile.diem_manh || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Điểm yếu</div><div style={{ fontWeight: '600' }}>{personalProfile.diem_yeu || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Lý do muốn sang Nhật</div><div style={{ fontWeight: '600' }}>{personalProfile.ly_do_sang_nhat || 'Chưa cập nhật'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Sở thích</div><div style={{ fontWeight: '600' }}>{personalProfile.so_thich || 'Chưa cập nhật'}</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
