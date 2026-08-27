import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const DEPARTMENTS = ['Hành chính kế toán', 'Marketing', 'Đối ngoại', 'Hồ sơ', 'Đào tạo', 'Kinh doanh'];

function getDeptTagStyle(dept = '') {
  if (dept.includes('Kinh doanh')) return { background: 'var(--teal-soft)', color: 'var(--teal)' };
  if (dept.includes('Marketing')) return { background: 'var(--gold-soft)', color: 'var(--gold)' };
  if (dept.includes('Đối ngoại')) return { background: 'var(--coral-soft)', color: 'var(--coral)' };
  if (dept.includes('Hồ sơ')) return { background: '#E7EEFC', color: '#3B6FD1' };
  if (dept.includes('Đào tạo')) return { background: 'var(--green-soft)', color: 'var(--green)' };
  if (dept.includes('Hành chính')) return { background: '#F1E9FB', color: '#7C3AED' };
  return { background: 'var(--teal-soft)', color: 'var(--teal)' };
}

const RATING_STAMP = {
  excellent: 'stamp stamp-visa',
  pass: 'stamp stamp-submitted',
  'needs-improvement': 'stamp stamp-processing',
  fail: 'stamp stamp-leave'
};

const RATING_BAR_COLOR = {
  excellent: 'var(--green)',
  pass: '#3B6FD1',
  'needs-improvement': 'var(--gold)',
  fail: 'var(--text-faint)'
};

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const removeAccents = (str) => (str || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export default function CompetencyTestPage({ setCurrentPage, setSelectedExamId }) {
  const [activeTab, setActiveTab] = useState('exams');

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examDeptFilter, setExamDeptFilter] = useState('all');
  const [examSearch, setExamSearch] = useState('');

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultDeptFilter, setResultDeptFilter] = useState('all');
  const [resultSearch, setResultSearch] = useState('');

  const fetchExams = () => {
    setLoadingExams(true);
    apiFetch('/api/competency-exams')
      .then(res => res.json())
      .then(d => { setExams(d.exams || []); setLoadingExams(false); })
      .catch(err => { console.error('Fetch error:', err); setLoadingExams(false); });
  };

  const fetchResults = () => {
    setLoadingResults(true);
    apiFetch('/api/competency-results')
      .then(res => res.json())
      .then(d => { setResults(d.results || []); setLoadingResults(false); })
      .catch(err => { console.error('Fetch error:', err); setLoadingResults(false); });
  };

  useEffect(() => { fetchExams(); fetchResults(); }, []);

  const handleCreateExam = () => {
    setSelectedExamId(null);
    setCurrentPage('competency-builder');
  };

  const handleEditExam = (exam) => {
    setSelectedExamId(exam.id);
    setCurrentPage('competency-builder');
  };

  const handleDeleteExam = (exam) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${exam.name}"? Toàn bộ câu hỏi và kết quả liên quan sẽ bị xóa vĩnh viễn.`)) {
      apiFetch(`/api/competency-exams/${exam.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) { fetchExams(); fetchResults(); }
          else alert(data.error || 'Lỗi khi xóa đề thi');
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const filteredExams = exams.filter(e => {
    const matchDept = examDeptFilter === 'all' || e.department === examDeptFilter;
    let matchSearch = true;
    if (examSearch.trim()) {
      matchSearch = removeAccents(e.name).includes(removeAccents(examSearch));
    }
    return matchDept && matchSearch;
  });

  const filteredResults = results.filter(r => {
    const matchDept = resultDeptFilter === 'all' || r.department === resultDeptFilter;
    let matchSearch = true;
    if (resultSearch.trim()) {
      matchSearch = removeAccents(r.employeeName).includes(removeAccents(resultSearch));
    }
    return matchDept && matchSearch;
  });

  const activeExamCount = exams.filter(e => e.status === 'active').length;
  const inactiveExamCount = exams.filter(e => e.status !== 'active').length;
  const totalAttempts = exams.reduce((sum, e) => sum + (e.attemptCount || 0), 0);

  const exportResultsCsv = () => {
    const header = ['Nhân viên', 'Phòng ban', 'Bộ đề', 'Điểm', 'Tổng câu', 'Xếp loại', 'Ngày làm'];
    const lines = [header.join(',')];
    filteredResults.forEach(r => {
      lines.push([r.employeeName, r.department, r.examName, r.correct, r.total, r.rating, r.takenAt]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ket-qua-test-nang-luc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${exams.length} bộ đề · ${results.length} lượt làm bài`}
        title="Test năng lực nhân viên"
        subtitle="Bộ đề đánh giá năng lực theo phòng ban và kết quả nhân viên đã làm."
        rightAction={
          activeTab === 'exams' ? (
            <button className="btn-primary" onClick={handleCreateExam}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Tạo đề thi mới
            </button>
          ) : (
            <button className="btn-ghost" onClick={exportResultsCsv}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Xuất Excel
            </button>
          )
        }
      />

      <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 3, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content', marginBottom: '18px' }}>
        {[['exams', 'Quản lý đề thi'], ['results', 'Kết quả']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: activeTab === key ? 'var(--surface)' : 'transparent',
              color: activeTab === key ? 'var(--navy)' : 'var(--text-soft)',
              boxShadow: activeTab === key ? 'var(--shadow)' : 'none'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: '18px' }}>
        <div className="stat-card">
          <div className="stat-value">{exams.length}</div>
          <div className="stat-label">Tổng bộ đề</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeExamCount}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inactiveExamCount}</div>
          <div className="stat-label">Tạm dừng</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalAttempts}</div>
          <div className="stat-label">Tổng lượt làm bài</div>
        </div>
      </div>

      {activeTab === 'exams' ? (
        <>
          <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className={`chip ${examDeptFilter === 'all' ? 'active' : ''}`} onClick={() => setExamDeptFilter('all')}>Tất cả ({exams.length})</div>
              {DEPARTMENTS.map(dep => (
                <div key={dep} className={`chip ${examDeptFilter === dep ? 'active' : ''}`} onClick={() => setExamDeptFilter(dep)}>
                  {dep} ({exams.filter(e => e.department === dep).length})
                </div>
              ))}
            </div>
            <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '260px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Tìm tên đề thi..." value={examSearch} onChange={(e) => setExamSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }} />
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên đề thi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phòng ban</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số câu</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Lượt làm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày tạo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingExams ? (
                    <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải danh sách đề thi...</td></tr>
                  ) : filteredExams.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Không tìm thấy đề thi nào phù hợp.</td></tr>
                  ) : (
                    filteredExams.map((exam) => (
                      <tr key={exam.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--navy)' }}>{exam.name}</td>
                        <td style={{ padding: '14px 16px' }}><span className="dept-tag" style={getDeptTagStyle(exam.department)}>{exam.department}</span></td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{exam.questionCount}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{exam.attemptCount}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={exam.status === 'active' ? 'stamp stamp-active' : 'stamp stamp-leave'}>
                            {exam.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{exam.createdAt}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button className="row-action" title="Sửa đề" onClick={() => handleEditExam(exam)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="row-action" title="Xóa" onClick={() => handleDeleteExam(exam)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className={`chip ${resultDeptFilter === 'all' ? 'active' : ''}`} onClick={() => setResultDeptFilter('all')}>Tất cả ({results.length})</div>
              {DEPARTMENTS.map(dep => (
                <div key={dep} className={`chip ${resultDeptFilter === dep ? 'active' : ''}`} onClick={() => setResultDeptFilter(dep)}>
                  {dep} ({results.filter(r => r.department === dep).length})
                </div>
              ))}
            </div>
            <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '260px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Tìm tên nhân viên..." value={resultSearch} onChange={(e) => setResultSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }} />
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhân viên</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bộ đề</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Xếp loại</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày làm</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingResults ? (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải kết quả...</td></tr>
                  ) : filteredResults.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có lượt làm bài nào phù hợp.</td></tr>
                  ) : (
                    filteredResults.map((r) => {
                      const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initialsOf(r.employeeName)}</div>
                              <div style={{ minWidth: 0 }}>
                                <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{r.employeeName}</div>
                                <span className="dept-tag" style={{ ...getDeptTagStyle(r.department), marginTop: '2px', display: 'inline-block' }}>{r.department}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-soft)' }}>{r.examName}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: '140px' }}>
                              <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'var(--bg)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: RATING_BAR_COLOR[r.ratingTier] }}></div>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{r.correct}/{r.total}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}><span className={RATING_STAMP[r.ratingTier]}>{r.rating}</span></td>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.takenAt}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
