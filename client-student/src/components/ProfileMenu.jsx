import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../lib/apiFetch';

export default function ProfileMenu({ profile, onClose, onLogout, onAvatarChange }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới nhập lại không khớp');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }
      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await apiFetch('/api/student/upload-avatar', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || 'Tải ảnh thất bại');
        return;
      }
      onAvatarChange?.(data.avatarUrl);
    } catch {
      setAvatarError('Lỗi kết nối máy chủ');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--navy)' }}>Hồ sơ của tôi</h3>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, borderRadius: 14, overflow: 'hidden' }}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (profile?.avatar || '?')}
              </div>
              <button
                onClick={handleAvatarPick}
                disabled={uploadingAvatar}
                title="Đổi ảnh đại diện"
                style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', color: '#fff', border: '2px solid var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, padding: 0 }}
              >
                {uploadingAvatar ? '…' : '✎'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarFile} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--navy)' }}>{profile?.name || 'Học viên'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{profile?.id || ''}</div>
              {profile?.email && <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{profile.email}</div>}
              <button onClick={handleAvatarPick} disabled={uploadingAvatar} style={{ marginTop: 4, background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {uploadingAvatar ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
              </button>
              {avatarError && <div style={{ fontSize: 11.5, color: 'var(--coral)', marginTop: 2 }}>{avatarError}</div>}
            </div>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Đổi mật khẩu</div>
            <input
              type="password" required placeholder="Mật khẩu hiện tại" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13.5 }}
            />
            <input
              type="password" required placeholder="Mật khẩu mới (ít nhất 6 ký tự)" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13.5 }}
            />
            <input
              type="password" required placeholder="Nhập lại mật khẩu mới" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13.5 }}
            />
            {error && <div style={{ fontSize: 12.5, color: 'var(--coral)' }}>{error}</div>}
            {success && <div style={{ fontSize: 12.5, color: 'var(--green)' }}>{success}</div>}
            <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '9px 18px' }}>
              {submitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onLogout} className="btn-ghost" style={{ padding: '9px 18px', color: 'var(--coral)' }}>Đăng xuất</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
