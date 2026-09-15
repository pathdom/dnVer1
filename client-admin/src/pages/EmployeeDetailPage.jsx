import React, { useEffect, useState } from 'react';
import { apiFetch, resolveUrl } from '../lib/apiFetch';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function EmployeeDetailPage({ empId, setCurrentPage, setSelectedStudentId }) {
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [personalProfile, setPersonalProfile] = useState(null);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const targetId = empId || 'NV001';
    apiFetch(`/api/employees/${targetId}`)
      .then(res => {
        if (!res.ok) throw new Error('Employee not found');
        return res.json();
      })
      .then(data => {
        setEmp(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching employee detail:', err);
        apiFetch('/api/employees')
          .then(res => res.json())
          .then(d => {
            if (d.employees && d.employees.length > 0) {
              setEmp(d.employees[0]);
            } else {
              setEmp({
                id: 'NV001',
                name: 'Lê Thu Hà',
                email: 'ha.le@aladdin.vn',
                phone: '0911223344',
                department: 'Chưa xác định',
                role: 'Chuyên viên tư vấn',
                workType: 'Chính thức',
                statusText: 'Đang làm việc',
                startDate: '10/01/2025',
                avatar: 'LH'
              });
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [empId]);

  useEffect(() => {
    if (!emp) return;
    setPersonalLoading(true);
    apiFetch(`/api/employees/${emp.id}/personal-profile`)
      .then(res => res.json())
      .then(d => {
        setPersonalProfile(d.profile || null);
        setPersonalDocuments(d.documents || []);
      })
      .catch(() => { setPersonalProfile(null); setPersonalDocuments([]); })
      .finally(() => setPersonalLoading(false));
  }, [emp?.id]);

  const handleDownloadDoc = (doc) => {
    apiFetch(`/api/staff-documents/${doc.id}/download`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = doc.tenGoc;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('Không thể tải tài liệu'));
  };

  if (loading) {
    return (
      <section className="page active" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow)', display: 'inline-block' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div style={{ fontWeight: '600', color: 'var(--navy)' }}>Đang tải thông tin chi tiết nhân viên từ CSDL...</div>
        </div>
      </section>
    );
  }

  if (!emp) {
    return (
      <section className="page active" style={{ padding: '40px' }}>
        <button className="breadcrumb" onClick={() => setCurrentPage('employees')}>
          ← Quay lại danh sách nhân viên
        </button>
        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '16px' }}>
          Không tìm thấy thông tin nhân viên.
        </div>
      </section>
    );
  }

  return (
    <section className="page active">
      <button className="breadcrumb" onClick={() => setCurrentPage('employees')} style={{ cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Quay lại danh sách nhân viên
      </button>

      <div className="profile-header" style={{ marginTop: '12px' }}>
        <div className="profile-header-left">
          <div className="avatar profile-avatar" style={{ background: 'var(--teal-soft)', color: 'var(--teal)', fontWeight: '700', overflow: 'hidden' }}>
            {emp.avatarUrl ? (
              <img src={resolveUrl(emp.avatarUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (emp.avatar || 'NV')}
          </div>
          <div>
            <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="profile-name" style={{ fontSize: '22px', fontWeight: '700' }}>{emp.name}</span>
              <span className="stamp stamp-green">{emp.statusText || 'Đang làm việc'}</span>
            </div>
            <div className="profile-meta" style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-soft)' }}>
              <span>📋 Mã {emp.id}</span>
              <span>💼 {emp.role || 'Chuyên viên tư vấn'}</span>
              <span>🏢 {emp.department || 'Phòng tư vấn tuyển sinh'}</span>
              <span>📞 {emp.phone || 'Chưa có SĐT'}</span>
              <span>✉️ {emp.email || 'Chưa có email'}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => setCurrentPage('internalchat')}>💬 Nhắn tin nội bộ</button>
          <button className="btn-primary" onClick={() => setCurrentPage('employees')}>✏️ Cập nhật CSDL</button>
        </div>
      </div>

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px', alignItems: 'stretch' }}>
        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👤 Thông tin cá nhân & Nhân sự</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Họ và tên</div><div style={{ fontWeight: '600' }}>{emp.name}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày sinh</div><div style={{ fontWeight: '600' }}>{emp.dob || '15/08/1995'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số điện thoại</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{emp.phone || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Email làm việc</div><div style={{ fontWeight: '600' }}>{emp.email || 'N/A'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số CCCD / CMND</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{emp.passport || '001195001234'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Địa chỉ sinh sống</div><div style={{ fontWeight: '600' }}>{emp.address || 'Q. Cầu Giấy, Hà Nội'}</div></div>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>🏢 Vị trí công tác & Phòng ban</h3>
            </div>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Phòng ban công tác</div><div style={{ fontWeight: '700', color: 'var(--teal)' }}>{emp.department || 'Chưa xác định'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Chức danh nhiệm vụ</div><div style={{ fontWeight: '600' }}>{emp.role || 'Chuyên viên tư vấn'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Hình thức hợp đồng</div><div style={{ fontWeight: '600' }}>{emp.workType || 'Chính thức'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Trạng thái làm việc</div><div style={{ fontWeight: '600' }}>{emp.statusText || 'Đang làm việc'}</div></div>
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày gia nhập trung tâm</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{emp.startDate || '10/01/2025'}</div></div>
            </div>
          </div>
        </div>

        <div className="col-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>🎓 Danh sách Học viên đang phụ trách ({emp.assignedStudents ? emp.assignedStudents.length : 0})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Mã HV</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Họ và tên</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Hồ sơ</th>
                  </tr>
                </thead>
                <tbody>
                  {(emp.assignedStudents || []).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>{s.id}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{s.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            if (setSelectedStudentId) setSelectedStudentId(s.id);
                            setCurrentPage('student-detail');
                          }}
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                        >
                          👁️ Hồ sơ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginTop: '20px' }}>
        <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📋 Hồ sơ cá nhân (nhân viên tự khai)</h3>
        </div>
        {personalLoading ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Đang tải hồ sơ cá nhân...</div>
        ) : !personalProfile && personalDocuments.length === 0 ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Nhân viên chưa khai hồ sơ cá nhân.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Giấy tờ tùy thân</div>
                <div className="info-grid" style={{ display: 'grid', gap: '12px', fontSize: '13.5px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số CCCD/Hộ chiếu</div><div style={{ fontWeight: '600' }}>{personalProfile?.so_cccd || 'Chưa cập nhật'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày cấp</div><div style={{ fontWeight: '600' }}>{personalProfile?.ngay_cap_cccd || 'Chưa cập nhật'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Nơi cấp</div><div style={{ fontWeight: '600' }}>{personalProfile?.noi_cap_cccd || 'Chưa cập nhật'}</div></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Địa chỉ cư trú</div>
                <div className="info-grid" style={{ display: 'grid', gap: '12px', fontSize: '13.5px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Địa chỉ thường trú</div><div style={{ fontWeight: '600' }}>{personalProfile?.dia_chi_thuong_tru || 'Chưa cập nhật'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Chỗ ở hiện tại</div><div style={{ fontWeight: '600' }}>{personalProfile?.dia_chi_hien_tai || 'Chưa cập nhật'}</div></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Liên hệ khẩn cấp</div>
                <div className="info-grid" style={{ display: 'grid', gap: '12px', fontSize: '13.5px' }}>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Họ tên người liên hệ</div><div style={{ fontWeight: '600' }}>{personalProfile?.lien_he_ho_ten || 'Chưa cập nhật'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số điện thoại</div><div style={{ fontWeight: '600' }}>{personalProfile?.lien_he_sdt || 'Chưa cập nhật'}</div></div>
                  <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Mối quan hệ</div><div style={{ fontWeight: '600' }}>{personalProfile?.lien_he_quan_he || 'Chưa cập nhật'}</div></div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal)', marginBottom: '10px', textTransform: 'uppercase' }}>Tài liệu đính kèm ({personalDocuments.length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tên tài liệu</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Loại</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Kích thước</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ngày tải</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {personalDocuments.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có tài liệu nào.</td></tr>
                  ) : (
                    personalDocuments.map(doc => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '600' }}>{doc.tenGoc}</td>
                        <td style={{ padding: '8px 10px' }}><span className="chip" style={{ cursor: 'default' }}>{doc.loai}</span></td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-soft)' }}>{formatSize(doc.kichThuoc)}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{doc.ngayTai}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button className="row-action" title="Tải xuống" onClick={() => handleDownloadDoc(doc)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>⬇️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
