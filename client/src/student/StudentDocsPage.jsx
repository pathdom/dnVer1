import React, { useEffect, useState } from 'react';

export default function StudentDocsPage() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    fetch('/api/student/documents')
      .then(res => res.json())
      .then(data => setDocs(data))
      .catch(err => console.error(err));
  }, []);

  const handleUpload = () => {
    const fileName = prompt('Nhập tên tài liệu bạn muốn tải lên:', 'Thư mời công chứng.pdf');
    if (!fileName) return;

    fetch('/api/student/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fileName })
    })
      .then(res => res.json())
      .then(newDoc => {
        setDocs(prev => [...prev, newDoc]);
      });
  };

  const getStampClass = (status) => {
    switch (status) {
      case 'approved': return 'stamp stamp-green';
      case 'pending': return 'stamp stamp-gold';
      case 'required': return 'stamp stamp-coral';
      default: return 'stamp stamp-gold';
    }
  };

  return (
    <section className="portal-page active">
      <div className="page-title-row">
        <div>
          <h1>Tài liệu của tôi</h1>
          <p>Quản lý và tải lên các giấy tờ cần thiết cho hồ sơ du học.</p>
        </div>
      </div>

      <div className="panel">
        <div className="doc-summary-row">
          <span className="doc-summary-chip stamp-green" style={{ borderRadius: '20px', padding: '7px 13px' }}>
            ✓ Đã duyệt: {docs.filter(d => d.status === 'approved').length}
          </span>
          <span className="doc-summary-chip stamp-gold" style={{ borderRadius: '20px', padding: '7px 13px' }}>
            ⏳ Chờ duyệt: {docs.filter(d => d.status === 'pending').length}
          </span>
          <span className="doc-summary-chip stamp-coral" style={{ borderRadius: '20px', padding: '7px 13px' }}>
            ⚠ Cần bổ sung: {docs.filter(d => d.status === 'required').length}
          </span>
        </div>

        <div className="upload-zone" onClick={handleUpload} style={{ cursor: 'pointer' }}>
          <div className="icon-circle">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
          </div>
          <strong>Kéo thả tệp vào đây hoặc bấm để chọn tệp</strong>
          <span>Hỗ trợ PDF, JPG, PNG — tối đa 10MB</span>
          <button className="upload-btn" onClick={(e) => { e.stopPropagation(); handleUpload(); }}>Chọn tệp</button>
        </div>

        <div className="doc-list">
          {docs.map((doc) => (
            <div className="doc-row" key={doc.id}>
              <div className="doc-icon" style={doc.status === 'required' ? { background: 'var(--coral-soft)', color: 'var(--coral)' } : {}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.name}</div>
                <div className="doc-sub">{doc.date === 'Chưa tải lên' ? 'Chưa tải lên' : `Tải lên ${doc.date}`}</div>
              </div>
              <span className={getStampClass(doc.status)}>{doc.statusText}</span>
              <span className="doc-action" onClick={handleUpload}>{doc.status === 'required' ? 'Tải lên' : 'Xem'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
