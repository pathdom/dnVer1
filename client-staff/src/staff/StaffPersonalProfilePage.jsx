import React, { useEffect, useState } from 'react';
import { apiFetch, resolveUrl } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const emptyProfile = () => ({
  so_cccd: '', ngay_cap_cccd: '', noi_cap_cccd: '',
  dia_chi_thuong_tru: '', dia_chi_hien_tai: '',
  lien_he_ho_ten: '', lien_he_sdt: '', lien_he_quan_he: ''
});

const labelStyle = { display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' };
const panelStyle = { background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px' };

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function StaffPersonalProfilePage({ profile: staffProfile, onAvatarChange }) {
  const [profile, setProfile] = useState(emptyProfile());
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docMsg, setDocMsg] = useState('');

  const fetchProfile = () => {
    setLoading(true);
    apiFetch('/api/staff/personal-profile')
      .then(res => res.json())
      .then(d => {
        setProfile(d.profile ? { ...emptyProfile(), ...d.profile } : emptyProfile());
        setDocuments(d.documents || []);
      })
      .catch(err => console.error('Lỗi tải hồ sơ cá nhân:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    setSaving(true);
    setMsg('');
    apiFetch('/api/staff/personal-profile', {
      method: 'PUT',
      body: JSON.stringify({ profile })
    })
      .then(res => res.json())
      .then(data => {
        setSaving(false);
        if (data.success) {
          setMsg('✅ Đã lưu hồ sơ cá nhân');
          setTimeout(() => setMsg(''), 3000);
        } else {
          setMsg('❌ ' + (data.error || 'Có lỗi xảy ra'));
        }
      })
      .catch(err => { setSaving(false); setMsg('❌ Lỗi kết nối máy chủ: ' + err.message); });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    apiFetch('/api/staff/upload-avatar', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        setUploadingAvatar(false);
        if (data.success && onAvatarChange) onAvatarChange(data.avatarUrl);
      })
      .catch(() => setUploadingAvatar(false));
    e.target.value = '';
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    setDocMsg('');
    const formData = new FormData();
    formData.append('document', file);
    apiFetch('/api/staff/documents', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        setUploadingDoc(false);
        if (data.success) {
          fetchProfile();
        } else {
          setDocMsg('❌ ' + (data.error || 'Không thể tải lên'));
        }
      })
      .catch(err => { setUploadingDoc(false); setDocMsg('❌ Lỗi kết nối máy chủ: ' + err.message); });
    e.target.value = '';
  };

  const handleDownload = (doc) => {
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

  const handleDeleteDoc = (doc) => {
    if (!window.confirm(`Xóa tài liệu "${doc.tenGoc}"?`)) return;
    apiFetch(`/api/staff/documents/${doc.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { if (data.success) fetchProfile(); })
      .catch(() => {});
  };

  if (loading) {
    return (
      <section className="page active" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow)', display: 'inline-block' }}>
          Đang tải hồ sơ cá nhân...
        </div>
      </section>
    );
  }

  return (
    <section className="page active">
      <Topbar
        title="Thông tin cá nhân"
        subtitle="Hồ sơ cá nhân tự khai — thông tin này chỉ bạn và quản trị viên xem được."
      />

      {msg && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '0' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', marginBottom: '14px' }}>📇 Giấy tờ tùy thân</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Số CCCD/Hộ chiếu">
              <input style={inputStyle} value={profile.so_cccd || ''} onChange={e => handleChange('so_cccd', e.target.value)} />
            </Field>
            <Field label="Ngày cấp">
              <input type="date" style={inputStyle} value={profile.ngay_cap_cccd || ''} onChange={e => handleChange('ngay_cap_cccd', e.target.value)} />
            </Field>
            <Field label="Nơi cấp">
              <input style={inputStyle} value={profile.noi_cap_cccd || ''} onChange={e => handleChange('noi_cap_cccd', e.target.value)} />
            </Field>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', marginBottom: '14px' }}>🏠 Địa chỉ cư trú</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Địa chỉ thường trú">
              <input style={inputStyle} value={profile.dia_chi_thuong_tru || ''} onChange={e => handleChange('dia_chi_thuong_tru', e.target.value)} />
            </Field>
            <Field label="Chỗ ở hiện tại">
              <input style={inputStyle} value={profile.dia_chi_hien_tai || ''} onChange={e => handleChange('dia_chi_hien_tai', e.target.value)} />
            </Field>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', marginBottom: '14px' }}>🚨 Liên hệ khẩn cấp</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Họ tên người liên hệ">
              <input style={inputStyle} value={profile.lien_he_ho_ten || ''} onChange={e => handleChange('lien_he_ho_ten', e.target.value)} />
            </Field>
            <Field label="Số điện thoại">
              <input style={inputStyle} value={profile.lien_he_sdt || ''} onChange={e => handleChange('lien_he_sdt', e.target.value)} />
            </Field>
            <Field label="Mối quan hệ">
              <input style={inputStyle} value={profile.lien_he_quan_he || ''} onChange={e => handleChange('lien_he_quan_he', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '10px 24px' }}>
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', marginBottom: '14px' }}>🖼️ Ảnh hồ sơ</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {staffProfile?.avatarUrl ? (
                <img src={resolveUrl(staffProfile.avatarUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px' }}>👤</span>
              )}
            </div>
            <label className="btn-ghost" style={{ cursor: 'pointer', fontSize: '12.5px', padding: '8px 16px' }}>
              {uploadingAvatar ? 'Đang tải lên...' : '📤 Chọn ảnh'}
              <input type="file" accept="image/*" hidden onChange={handleAvatarSelect} disabled={uploadingAvatar} />
            </label>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'center' }}>JPG, PNG, WEBP · Tối đa 5MB</div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📎 Tài liệu đính kèm</div>
            <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '12.5px', padding: '8px 16px' }}>
              {uploadingDoc ? 'Đang tải lên...' : '⬆️ Tải lên'}
              <input type="file" accept=".pdf,.doc,.docx,.zip,image/*" hidden onChange={handleDocumentSelect} disabled={uploadingDoc} />
            </label>
          </div>
          {docMsg && <div style={{ color: 'var(--coral)', fontSize: '12.5px', marginBottom: '10px' }}>{docMsg}</div>}
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '10px' }}>PDF, ảnh, Word, Zip · Tối đa 10MB</div>
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
                {documents.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có tài liệu nào.</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: '600' }}>{doc.tenGoc}</td>
                      <td style={{ padding: '8px 10px' }}><span className="chip" style={{ cursor: 'default' }}>{doc.loai}</span></td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-soft)' }}>{formatSize(doc.kichThuoc)}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{doc.ngayTai}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="row-action" title="Tải xuống" onClick={() => handleDownload(doc)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>⬇️</button>
                          <button className="row-action" title="Xóa" onClick={() => handleDeleteDoc(doc)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
