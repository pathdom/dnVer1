import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import NotificationBell from '../components/NotificationBell';

export default function StaffHomePage({ setCurrentPage, profile }) {
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const firstName = profile?.name ? profile.name.trim().split(/\s+/).pop() : '';

  useEffect(() => {
    apiFetch('/api/staff/overview')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setTasks(d.todayTasks || []);
      })
      .catch(err => console.error(err));
  }, []);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">Thứ Tư, 19/08/2026</div>
          <h1>Chào buổi sáng, {firstName || 'bạn'} 👋</h1>
          <p>Bạn có 5 buổi tư vấn và 3 công việc cần hoàn thành hôm nay.</p>
        </div>
        <div className="topbar-right">
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Tìm học viên..." />
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--teal-soft)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
            </div>
          </div>
          <div className="stat-value">{data?.stats?.assignedStudents || 32}</div>
          <div className="stat-label">Học viên đang phụ trách</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--blue-soft)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
          </div>
          <div className="stat-value">05</div>
          <div className="stat-label">Buổi tư vấn hôm nay</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--gold-soft)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
          </div>
          <div className="stat-value">03</div>
          <div className="stat-label">Công việc cần làm</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-soft)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
          </div>
          <div className="stat-value">{data?.stats?.visaRate || '92%'}</div>
          <div className="stat-label">Tỷ lệ hồ sơ đạt visa</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head">
            <h3>Lịch hôm nay</h3>
            <span className="link" onClick={() => setCurrentPage('appt')}>Xem tất cả →</span>
          </div>
          <div className="consult-list">
            {(data?.todaySchedule || []).map((item, idx) => (
              <div className="consult-row" key={idx}>
                <div className="consult-time">{item.time}</div>
                <div className="cell-person">
                  <div className="avatar">{item.avatar}</div>
                  <div>
                    <div className="cell-name">{item.name}</div>
                    <div className="cell-sub">{item.location}</div>
                  </div>
                </div>
                <span className={`stamp ${item.isNew ? 'stamp-gold' : 'stamp-teal'}`}>{item.statusText}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-stack">
          <div className="panel">
            <div className="panel-head"><h3>Cần theo dõi gấp</h3></div>
            <div className="priority-list">
              {(data?.urgentFollowUps || []).map((item, idx) => (
                <div className="priority-row" key={idx}>
                  <div className="priority-flag" style={{ background: item.level === 'high' ? 'var(--coral)' : 'var(--gold)' }}></div>
                  <div>
                    <div className="cell-name">{item.name}</div>
                    <div className="cell-sub">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Công việc hôm nay</h3></div>
            <div className="check-list">
              {tasks.map((task) => (
                <div key={task.id} className={`check-row ${task.done ? 'is-done' : ''}`} onClick={() => toggleTask(task.id)} style={{ cursor: 'pointer' }}>
                  <div className={`check-box ${task.done ? 'done' : ''}`}>
                    {task.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <div>
                    <div className="check-text">{task.title}</div>
                    {task.tag && <div className="check-sub">{task.tag}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
