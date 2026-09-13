import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const KNOWN_RELATIONS = ['Bố', 'Mẹ', 'Anh', 'Chị', 'Em'];
const emptyProfile = () => ({
  so_cccd: '', ngay_cap_cccd: '', gioi_tinh: '', ton_giao: '', dan_toc: '', tinh_trang_hon_nhan: '',
  ho_khau_thuong_tru: '', noi_tam_tru: '', sdt_nguoi_than: '',
  truong_tieu_hoc: '', tieu_hoc_tu: '', tieu_hoc_den: '',
  truong_trung_hoc: '', trung_hoc_tu: '', trung_hoc_den: '',
  truong_thpt: '', thpt_tu: '', thpt_den: '',
  truong_cd_dh: '', cd_dh_tu: '', cd_dh_den: '',
  lich_su_lam_viec: '', diem_manh: '', diem_yeu: '', ly_do_sang_nhat: '', so_thich: ''
});
const emptyMember = () => ({ quan_he: 'Bố', ho_ten: '', nam_sinh: '', nghe_nghiep: '' });

// Style gọn cho form này (không dùng chung .form-input/.form-group để khỏi ảnh hưởng trang đăng nhập)
const labelStyle = { display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 14px' };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 14px' };

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function StudentPersonalProfilePage({ profile: student }) {
  const [profile, setProfile] = useState(emptyProfile());
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/student/personal-profile')
      .then(res => res.json())
      .then(d => {
        setProfile(d.profile ? { ...emptyProfile(), ...d.profile } : emptyProfile());
        setFamily(d.family && d.family.length ? d.family : []);
      })
      .catch(err => console.error('Lỗi tải hồ sơ cá nhân:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const handleFamilyChange = (index, field, value) => {
    setFamily(prev => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMember = () => setFamily(prev => [...prev, emptyMember()]);
  const removeMember = (index) => setFamily(prev => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    setSaving(true);
    setMsg('');
    apiFetch('/api/student/personal-profile', {
      method: 'PUT',
      body: JSON.stringify({ profile, family })
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
      .catch(err => {
        setSaving(false);
        setMsg('❌ Lỗi kết nối máy chủ: ' + err.message);
      });
  };

  if (loading) {
    return (
      <section className="portal-page active">
        <div className="panel"><p style={{ color: 'var(--text-soft)' }}>Đang tải hồ sơ cá nhân...</p></div>
      </section>
    );
  }

  return (
    <section className="portal-page active">
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="panel-title" style={{ marginBottom: '4px' }}>Hồ sơ cá nhân</div>
          <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
            {student?.name} · {student?.phone || 'Chưa có SĐT'} — thông tin này sẽ được gửi cho tư vấn viên & trung tâm.
          </div>
        </div>
        {msg && <span style={{ fontSize: '13px', fontWeight: 600, color: msg.startsWith('✅') ? 'var(--green)' : 'var(--coral)' }}>{msg}</span>}
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Thông tin cá nhân</div>
        <div style={grid3}>
          <Field label="Số CCCD">
            <input style={inputStyle} value={profile.so_cccd || ''} onChange={e => handleChange('so_cccd', e.target.value)} />
          </Field>
          <Field label="Ngày cấp">
            <input type="date" style={inputStyle} value={profile.ngay_cap_cccd || ''} onChange={e => handleChange('ngay_cap_cccd', e.target.value)} />
          </Field>
          <Field label="Giới tính">
            <select style={inputStyle} value={profile.gioi_tinh || ''} onChange={e => handleChange('gioi_tinh', e.target.value)}>
              <option value="">-- Chọn --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </Field>
          <Field label="Tôn giáo">
            <input style={inputStyle} value={profile.ton_giao || ''} onChange={e => handleChange('ton_giao', e.target.value)} />
          </Field>
          <Field label="Dân tộc">
            <input style={inputStyle} value={profile.dan_toc || ''} onChange={e => handleChange('dan_toc', e.target.value)} />
          </Field>
          <Field label="Tình trạng hôn nhân">
            <input style={inputStyle} value={profile.tinh_trang_hon_nhan || ''} onChange={e => handleChange('tinh_trang_hon_nhan', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Nơi cư trú</div>
        <div style={grid2}>
          <Field label="Hộ khẩu thường trú">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.ho_khau_thuong_tru || ''} onChange={e => handleChange('ho_khau_thuong_tru', e.target.value)} />
          </Field>
          <Field label="Nơi tạm trú">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.noi_tam_tru || ''} onChange={e => handleChange('noi_tam_tru', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Liên hệ</div>
        <div style={grid3}>
          <Field label="SĐT học viên">
            <div style={{ ...inputStyle, background: 'var(--surface)', color: 'var(--text-soft)' }}>{student?.phone || 'Chưa cập nhật'}</div>
          </Field>
          <Field label="SĐT người thân">
            <input style={inputStyle} value={profile.sdt_nguoi_than || ''} onChange={e => handleChange('sdt_nguoi_than', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Quá trình học tập</div>
        {[
          { label: 'Trường Tiểu học', key: 'truong_tieu_hoc', tu: 'tieu_hoc_tu', den: 'tieu_hoc_den' },
          { label: 'Trường Trung học', key: 'truong_trung_hoc', tu: 'trung_hoc_tu', den: 'trung_hoc_den' },
          { label: 'Trường THPT', key: 'truong_thpt', tu: 'thpt_tu', den: 'thpt_den' },
          { label: 'Trường Cao đẳng/Đại học', key: 'truong_cd_dh', tu: 'cd_dh_tu', den: 'cd_dh_den' }
        ].map(row => (
          <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <Field label={row.label}>
              <input style={inputStyle} value={profile[row.key] || ''} onChange={e => handleChange(row.key, e.target.value)} />
            </Field>
            <Field label="Từ năm">
              <input style={inputStyle} placeholder="VD: 2015" value={profile[row.tu] || ''} onChange={e => handleChange(row.tu, e.target.value)} />
            </Field>
            <Field label="Đến năm">
              <input style={inputStyle} placeholder="VD: 2020" value={profile[row.den] || ''} onChange={e => handleChange(row.den, e.target.value)} />
            </Field>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Lịch sử làm việc</div>
        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Công ty/vị trí/thời gian làm việc (nếu có)..." value={profile.lich_su_lam_viec || ''} onChange={e => handleChange('lich_su_lam_viec', e.target.value)} />
      </div>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Thông tin gia đình</div>
          <button className="btn-primary" type="button" onClick={addMember} style={{ padding: '6px 14px', fontSize: '12.5px' }}>+ Thêm thành viên</button>
        </div>

        {family.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Chưa có thành viên nào. Bấm "+ Thêm thành viên" để thêm.</p>
        )}

        {family.map((m, i) => {
          const selectVal = KNOWN_RELATIONS.includes(m.quan_he) ? m.quan_he : 'Khác';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: selectVal === 'Khác' ? '0.8fr 0.8fr 1.4fr 0.8fr 1fr auto' : '0.8fr 1.4fr 0.8fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '10px', paddingBottom: '10px', borderBottom: i < family.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Field label="Quan hệ">
                <select style={inputStyle} value={selectVal} onChange={e => handleFamilyChange(i, 'quan_he', e.target.value === 'Khác' ? '' : e.target.value)}>
                  {KNOWN_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="Khác">Khác</option>
                </select>
              </Field>
              {selectVal === 'Khác' && (
                <Field label="Ghi rõ">
                  <input style={inputStyle} placeholder="VD: Cậu" value={m.quan_he || ''} onChange={e => handleFamilyChange(i, 'quan_he', e.target.value)} />
                </Field>
              )}
              <Field label="Họ tên">
                <input style={inputStyle} value={m.ho_ten || ''} onChange={e => handleFamilyChange(i, 'ho_ten', e.target.value)} />
              </Field>
              <Field label="Năm sinh">
                <input style={inputStyle} placeholder="VD: 1980" value={m.nam_sinh || ''} onChange={e => handleFamilyChange(i, 'nam_sinh', e.target.value)} />
              </Field>
              <Field label="Nghề nghiệp">
                <input style={inputStyle} value={m.nghe_nghiep || ''} onChange={e => handleFamilyChange(i, 'nghe_nghiep', e.target.value)} />
              </Field>
              <button
                type="button"
                onClick={() => removeMember(i)}
                title="Xóa thành viên"
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--coral)', fontSize: '13px' }}
              >✕</button>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: '12px' }}>Bản thân</div>
        <div style={grid2}>
          <Field label="Điểm mạnh">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.diem_manh || ''} onChange={e => handleChange('diem_manh', e.target.value)} />
          </Field>
          <Field label="Điểm yếu">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.diem_yeu || ''} onChange={e => handleChange('diem_yeu', e.target.value)} />
          </Field>
          <Field label="Lý do muốn sang Nhật học tập/làm việc">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.ly_do_sang_nhat || ''} onChange={e => handleChange('ly_do_sang_nhat', e.target.value)} />
          </Field>
          <Field label="Sở thích">
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={profile.so_thich || ''} onChange={e => handleChange('so_thich', e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 28px' }}>
          {saving ? 'Đang lưu...' : 'Lưu hồ sơ cá nhân'}
        </button>
      </div>
    </section>
  );
}
