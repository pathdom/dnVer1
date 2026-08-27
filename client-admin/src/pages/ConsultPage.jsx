import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const DOWS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const TYPE_OPTIONS = [
  ['khach_hang', 'Khách hàng'],
  ['hoc_vien', 'Học viên'],
  ['du_an', 'Dự án / Trường đối tác'],
  ['khac', 'Khác']
];
const STATUS_OPTIONS = ['Đã đặt lịch', 'Đã hoàn thành', 'Đã hủy'];

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDayMonth(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getStatusStamp(status) {
  if (status === 'Đã hoàn thành') return 'stamp stamp-visa';
  if (status === 'Đã hủy') return 'stamp stamp-hold';
  return 'stamp stamp-new';
}

export default function ConsultPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '', datetime: '', type: 'khach_hang', khachHangId: '', hocVienId: '', nhanVienId: '', note: '', status: 'Đã đặt lịch'
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const todayStr = fmtDate(new Date());

  const fetchAppointments = () => {
    setLoading(true);
    apiFetch(`/api/appointments?start=${fmtDate(weekStart)}&end=${fmtDate(weekEnd)}`)
      .then(res => res.json())
      .then(d => { setAppointments(d.appointments || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchAppointments(); }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiFetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.customers || [])).catch(() => {});
    apiFetch('/api/students').then(r => r.json()).then(d => setStudents(d.students || [])).catch(() => {});
    apiFetch('/api/employees').then(r => r.json()).then(d => setStaff(d.employees || [])).catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = (presetDate) => {
    setEditingAppt(null);
    setFormData({
      title: '', datetime: presetDate ? `${presetDate}T09:00` : '', type: 'khach_hang',
      khachHangId: '', hocVienId: '', nhanVienId: '', note: '', status: 'Đã đặt lịch'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (a) => {
    setEditingAppt(a);
    setFormData({
      title: a.title || '',
      datetime: `${a.date}T${a.time}`,
      type: a.type || 'khac',
      khachHangId: a.khachHangId || '',
      hocVienId: a.hocVienId || '',
      nhanVienId: a.nhanVienId || '',
      note: a.note || '',
      status: a.status || 'Đã đặt lịch'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (a) => {
    if (window.confirm(`Xóa lịch "${a.title}"?`)) {
      apiFetch(`/api/appointments/${a.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || 'Đã xóa lịch tư vấn');
            setTimeout(() => setToastMessage(''), 4000);
            fetchAppointments();
          } else {
            alert(data.error || 'Lỗi khi xóa');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.datetime) {
      alert('Vui lòng nhập tiêu đề và thời gian!');
      return;
    }
    setSubmitting(true);
    const isEdit = !!editingAppt;
    const url = isEdit ? `/api/appointments/${editingAppt.id}` : '/api/appointments';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, { method, body: JSON.stringify(formData) })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Đã đặt lịch tư vấn!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchAppointments();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = fmtDate(d);
    days.push({
      date: dateStr,
      label: DOWS[i],
      dayMonth: fmtDayMonth(d),
      isToday: dateStr === todayStr,
      items: appointments.filter(a => a.date === dateStr)
    });
  }

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${fmtDayMonth(weekStart)} – ${fmtDayMonth(weekEnd)}`}
        title="Lịch tư vấn"
        subtitle="Quản lý lịch hẹn tư vấn với khách hàng và học viên."
        rightAction={
          <button className="btn-primary" onClick={() => handleOpenAddModal(todayStr)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Đặt lịch mới
          </button>
        }
      />

      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h3>Tuần {fmtDayMonth(weekStart)} – {fmtDayMonth(weekEnd)} · {appointments.length} buổi hẹn</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; })}>← Tuần trước</button>
            <button className="btn-ghost" onClick={() => setWeekStart(mondayOf(new Date()))}>Tuần này</button>
            <button className="btn-ghost" onClick={() => setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; })}>Tuần sau →</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 20px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0' }}>Đang tải lịch tư vấn...</div>
          ) : days.map(day => (
            <div key={day.date} style={{ border: `1px solid ${day.isToday ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: day.isToday ? 'var(--teal-soft)' : 'var(--bg)' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: day.isToday ? 'var(--teal)' : 'var(--navy)' }}>{day.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{day.dayMonth}</span>
                <button
                  onClick={() => handleOpenAddModal(day.date)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 12, fontWeight: 600 }}
                >
                  + Thêm lịch
                </button>
              </div>
              <div>
                {day.items.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-faint)' }}>Không có lịch hẹn</div>
                ) : day.items.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: '1px solid var(--line-soft, var(--border))' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--teal)', width: 46, flexShrink: 0 }}>{a.time}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{a.displayTitle}</div>
                      {a.nhanVienName && <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Phụ trách: {a.nhanVienName}</div>}
                    </div>
                    <span className={getStatusStamp(a.status)}>{a.status}</span>
                    <button className="row-action" title="Sửa" onClick={() => handleOpenEditModal(a)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', borderRadius: 8, padding: 5 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="row-action" title="Xóa" onClick={() => handleDelete(a)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: 8, padding: 5 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingAppt ? '✏️ Chỉnh sửa lịch tư vấn' : '➕ Đặt lịch tư vấn mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tiêu đề *</label>
                <input required name="title" value={formData.title} onChange={handleInputChange} placeholder="VD: Tư vấn du học Hàn Quốc" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày giờ *</label>
                  <input required type="datetime-local" name="datetime" value={formData.datetime} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Loại lịch hẹn</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {formData.type === 'khach_hang' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Khách hàng liên quan</label>
                  <select name="khachHangId" value={formData.khachHangId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="">Không chọn</option>
                    {customers.map(c => <option key={c.dbId} value={c.dbId}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {formData.type === 'hoc_vien' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Học viên liên quan</label>
                  <select name="hocVienId" value={formData.hocVienId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="">Không chọn</option>
                    {students.map(s => <option key={s.dbId || s.id} value={s.dbId || s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhân viên phụ trách</label>
                  <select name="nhanVienId" value={formData.nhanVienId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="">Chưa phân công</option>
                    {staff.map(s => <option key={s.dbId} value={s.dbId}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ghi chú</label>
                <input name="note" value={formData.note} onChange={handleInputChange} placeholder="Ghi chú thêm (không bắt buộc)" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu...' : editingAppt ? 'Lưu thay đổi' : 'Đặt lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
