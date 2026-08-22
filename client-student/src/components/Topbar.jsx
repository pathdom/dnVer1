import React from 'react';

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
        <div className="icon-btn" title="Thông báo">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="dot"></span>
        </div>
        {rightAction}
      </div>
    </div>
  );
}
