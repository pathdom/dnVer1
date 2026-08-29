import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const SEEN_KEY = 'aladdin_staff_notif_seen';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(() => Number(localStorage.getItem(SEEN_KEY) || 0));
  const ref = useRef(null);

  const fetchNotifications = () => {
    apiFetch('/api/staff/notifications')
      .then(res => res.json())
      .then(d => setNotifications(d.notifications || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.id > lastSeenId).length;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && notifications.length > 0) {
      const maxId = Math.max(...notifications.map(n => n.id));
      localStorage.setItem(SEEN_KEY, String(maxId));
      setLastSeenId(maxId);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="icon-btn" onClick={handleToggle} title="Thông báo" style={{ cursor: 'pointer' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {unreadCount > 0 && <span className="dot"></span>}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '44px', right: 0, width: '340px', maxHeight: '420px', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 30px rgba(15,20,35,0.18)', zIndex: 1000 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13.5, color: 'var(--navy)' }}>Thông báo</div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>Chưa có thông báo nào</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 3 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{n.time}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
