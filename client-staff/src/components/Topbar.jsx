import React from 'react';
import NotificationBell from './NotificationBell';

export default function Topbar({ eyebrow, title, subtitle, searchPlaceholder, rightAction }) {
  return (
    <div className="topbar">
      <div className="page-heading">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="topbar-right">
        {searchPlaceholder && (
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder={searchPlaceholder} />
          </div>
        )}
        <NotificationBell />
        {rightAction}
      </div>
    </div>
  );
}
