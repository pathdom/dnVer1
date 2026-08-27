import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

function getStampClass(statusText) {
  const st = (statusText || '').toLowerCase();
  if (st.includes('visa') || st.includes('tất')) return 'stamp stamp-visa';
  if (st.includes('tiếng') || st.includes('xử lý')) return 'stamp stamp-processing';
  if (st.includes('tiếp')) return 'stamp stamp-new';
  if (st.includes('nộp')) return 'stamp stamp-submitted';
  if (st.includes('hoãn')) return 'stamp stamp-hold';
  return 'stamp stamp-new';
}

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
function todayLabel() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const STUDENT_TABS = [['all', 'Tất cả'], ['processing', 'Đang xử lý'], ['done', 'Hoàn tất']];
const DOWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function buildWeekDays(week, weekAppointments) {
  if (!week?.start) return [];
  const monday = new Date(week.start + 'T00:00:00');
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      dow: DOWS[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      items: (weekAppointments || []).filter(a => a.date === dateStr)
    });
  }
  return days;
}

const DONUT_COLORS = ['var(--teal)', 'var(--gold)', 'var(--coral)', 'var(--green)', '#3B6FD1'];
const DONUT_R = 54;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

function buildDonutSegments(destinations) {
  let cumulative = 0;
  return destinations.map((d, i) => {
    const segLen = (d.percent / 100) * DONUT_CIRC;
    const seg = { ...d, color: DONUT_COLORS[i % DONUT_COLORS.length], dasharray: `${segLen} ${DONUT_CIRC - segLen}`, dashoffset: -cumulative };
    cumulative += segLen;
    return seg;
  });
}

function StageBox({ n, label, color }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg)' }}>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function OverviewPage({ setCurrentPage, setSelectedStudentId }) {
  const [data, setData] = useState(null);
  const [studentFilter, setStudentFilter] = useState('all');

  useEffect(() => {
    apiFetch('/api/overview')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  const recentStudents = data?.recentStudents || [];
  const filteredStudents = recentStudents.filter(s => {
    if (studentFilter === 'all') return true;
    const st = (s.statusText || '').toLowerCase();
    if (studentFilter === 'processing') return st.includes('tiếng') || st.includes('xử lý');
    if (studentFilter === 'done') return st.includes('tất');
    return true;
  });

  const stageMap = {};
  (data?.stages || []).forEach(s => { stageMap[s.stage] = s.count; });
  const destinations = data?.destinations || [];
  const tasks = data?.tasks || [];
  const weekDays = buildWeekDays(data?.week, data?.weekAppointments);
  const donutSegments = buildDonutSegments(destinations);

  return (
    <section className="page active">
      <Topbar
        eyebrow={todayLabel()}
        title="Chào mừng trở lại, Hằng 👋"
        subtitle="Đây là tình hình hoạt động của trung tâm hôm nay."
        searchPlaceholder="Tìm học viên, hồ sơ..."
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--teal-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
            </div>
            <div className="stat-trend trend-up">CSDL Thực</div>
          </div>
          <div className="stat-value">{data?.stats?.totalStudents ?? '...'}</div>
          <div className="stat-label">Tổng học viên trong CSDL</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--gold-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>
            </div>
            <div className="stat-trend trend-up">CSDL Thực</div>
          </div>
          <div className="stat-value">{data?.stats?.activeEmployees ?? '...'}</div>
          <div className="stat-label">Nhân viên đang làm việc</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: '#E7EEFC' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div className="stat-trend trend-flat">CSDL Thực</div>
          </div>
          <div className="stat-value">{data?.stats?.partnerSchools ?? '...'}</div>
          <div className="stat-label">Dự án & Trường đối tác</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
            <div className="stat-trend trend-up">CSDL Thực</div>
          </div>
          <div className="stat-value">{data?.stats?.revenue || '0 ₫'}</div>
          <div className="stat-label">Tổng thu đã thu từ CSDL</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head">
            <h3>Học viên cập nhật gần đây</h3>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
              {STUDENT_TABS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStudentFilter(key)}
                  style={{
                    padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: studentFilter === key ? 'var(--surface)' : 'transparent',
                    color: studentFilter === key ? 'var(--navy)' : 'var(--text-soft)',
                    boxShadow: studentFilter === key ? 'var(--shadow)' : 'none'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr><th>Học viên</th><th>Quốc gia</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedStudentId(s.id); setCurrentPage('student-detail'); }}>
                    <td>
                      <div className="cell-person">
                        <div className="avatar">{s.avatar}</div>
                        <div>
                          <div className="cell-name">{s.name}</div>
                          <div className="cell-sub">{s.program}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.country}</td>
                    <td><span className={getStampClass(s.statusText)}>{s.statusText}</span></td>
                  </tr>
                ))}
                {data && !filteredStudents.length && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0' }}>Không có học viên phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '4px 20px 20px' }}>
            <StageBox n={stageMap['Mới tiếp nhận'] || 0} label="Mới tiếp nhận" color="var(--teal)" />
            <StageBox n={stageMap['Đang học tiếng'] || 0} label="Đang học tiếng" color="var(--gold)" />
            <StageBox n={stageMap['Hoàn tất hồ sơ'] || 0} label="Hoàn tất hồ sơ" color="#3B6FD1" />
            <StageBox n={data?.stats?.unassignedCustomers ?? 0} label="Khách chờ phân công" color="var(--navy)" />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Quốc gia du học</h3>
              <div className="cell-sub" style={{ marginTop: 3 }}>Phân bổ {data?.stats?.totalStudents ?? 0} hồ sơ theo thị trường</div>
            </div>
          </div>
          {destinations.length > 0 ? (
            <div style={{ padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ position: 'relative', width: 168, height: 168 }}>
                <svg viewBox="0 0 140 140" width="168" height="168" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r={DONUT_R} fill="none" stroke="var(--bg)" strokeWidth="17" />
                  {donutSegments.map((s, i) => (
                    <circle
                      key={i} cx="70" cy="70" r={DONUT_R} fill="none" stroke={s.color} strokeWidth="17"
                      strokeDasharray={s.dasharray} strokeDashoffset={s.dashoffset}
                    />
                  ))}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{data?.stats?.totalStudents ?? 0}</div>
                  <div className="lbl">hồ sơ</div>
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {donutSegments.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }}></span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--text)' }}>{d.country}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{d.count}</span>
                    <span style={{ width: 42, textAlign: 'right', fontSize: 12, color: 'var(--text-soft)' }}>{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            data && <div style={{ color: 'var(--text-faint)', fontSize: 13, padding: '4px 20px 20px' }}>Chưa có dữ liệu.</div>
          )}
        </div>
      </div>

      <div className="grid-2col" style={{ marginTop: '16px' }}>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Lịch tư vấn tuần này</h3>
              <div className="cell-sub" style={{ marginTop: 3 }}>{data?.week?.label} · {(data?.weekAppointments || []).length} buổi đã đặt</div>
            </div>
            <span className="link" onClick={() => setCurrentPage('consult')}>Quản lý lịch →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 20px 20px' }}>
            {weekDays.map(day => (
              <div
                key={day.date}
                style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 12, padding: '9px 10px', borderRadius: 11, background: day.isToday ? 'var(--teal-soft)' : 'var(--bg)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--text-faint)', fontWeight: 600 }}>{day.dow}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: day.isToday ? 'var(--teal)' : 'var(--navy)' }}>{day.dayNum}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center', minWidth: 0 }}>
                  {day.items.length ? day.items.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--text)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: day.isToday ? 'var(--teal)' : 'var(--teal-soft)', flex: 'none' }}></span>
                      <span style={{ color: 'var(--text-soft)', width: 38, flex: 'none' }}>{a.time}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.displayTitle}</span>
                    </div>
                  )) : <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Không có lịch</div>}
                </div>
              </div>
            ))}
            {data && !weekDays.length && (
              <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, padding: '10px 0' }}>Đang tải lịch tuần...</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Cần xử lý</h3>
            {tasks.length > 0 && (
              <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>{tasks.length} việc</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 20px' }}>
            {tasks.map((t, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 13px', borderRadius: 12, background: 'var(--bg)', borderLeft: `3px solid ${t.hot ? 'var(--coral)' : 'var(--border)'}` }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)' }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{t.subtitle}</div>
                </div>
              </div>
            ))}
            {data && !tasks.length && (
              <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, padding: '10px 0' }}>✅ Không có việc cần xử lý.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
