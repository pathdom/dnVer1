import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StaffCompetencyPage() {
  const [mainTab, setMainTab] = useState('exams'); // 'exams' | 'results'

  // ============ ĐỀ THI ============
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [activeExam, setActiveExam] = useState(null); // { id, name, duration, questions }
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const timerRef = useRef(null);

  const fetchExams = () => {
    setExamsLoading(true);
    apiFetch('/api/staff/exams')
      .then(res => res.json())
      .then(d => { setExams(d.exams || []); setExamsLoading(false); })
      .catch(err => { console.error(err); setExamsLoading(false); });
  };

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleStartExam = (exam) => {
    apiFetch(`/api/staff/exams/${exam.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) { alert(d.error); return; }
        setActiveExam(d);
        setAnswers({});
        setExamResult(null);
        setSecondsLeft((d.duration || 45) * 60);
      })
      .catch(err => alert('Lỗi tải đề thi: ' + err.message));
  };

  const selectAnswer = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const submitExam = React.useCallback(() => {
    setSubmitting(true);
    apiFetch(`/api/staff/exams/${activeExam.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    })
      .then(res => res.json())
      .then(d => {
        setSubmitting(false);
        if (d.success) {
          setExamResult(d);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          alert(d.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  }, [activeExam, answers]);

  useEffect(() => {
    if (!activeExam || examResult) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeExam, examResult, submitExam]);

  const backToExamList = () => {
    setActiveExam(null);
    setExamResult(null);
    setAnswers({});
    fetchExams();
    fetchResults();
  };

  // ============ KẾT QUẢ ============
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  const fetchResults = () => {
    setResultsLoading(true);
    apiFetch('/api/staff/competency-results')
      .then(res => res.json())
      .then(d => { setResults(d.results || []); setResultsLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setResultsLoading(false); });
  };

  useEffect(() => { fetchResults(); }, []);

  const passCount = results.filter(r => r.result === 'Đạt').length;
  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : '0';

  // ============ RENDER: ĐANG LÀM BÀI ============
  if (activeExam && !examResult) {
    return (
      <section className="page active">
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', paddingBottom: 14, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: 'var(--navy)', margin: '0 0 4px' }}>{activeExam.name}</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{activeExam.questions.length} câu hỏi — chọn 1 đáp án cho mỗi câu</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: secondsLeft <= 60 ? 'var(--coral-soft)' : 'var(--teal-soft)', color: secondsLeft <= 60 ? 'var(--coral)' : 'var(--teal)', padding: '10px 18px', borderRadius: 14, fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {formatClock(secondsLeft)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeExam.questions.map((q, qIndex) => (
            <div key={q.id} className="panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--navy)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{qIndex + 1}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', paddingTop: 3 }}>{q.content}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginLeft: 36 }}>
                {q.answers.map((a, aIndex) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => selectAnswer(q.id, a.id)}
                    className={`chip ${answers[q.id] === a.id ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', whiteSpace: 'normal', lineHeight: 1.4 }}
                  >
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{ANSWER_LABELS[aIndex]}.</span>
                    <span>{a.content}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, padding: '16px 0' }}>
          <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>Đã trả lời {Object.keys(answers).length}/{activeExam.questions.length} câu</span>
          <button className="btn-primary" onClick={submitExam} disabled={submitting}>
            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
          </button>
        </div>
      </section>
    );
  }

  // ============ RENDER: KẾT QUẢ VỪA LÀM ============
  if (activeExam && examResult) {
    const passed = examResult.ketQua === 'Đạt';
    return (
      <section className="page active">
        <div className="panel" style={{ padding: '40px 30px', textAlign: 'center', maxWidth: 460, margin: '40px auto' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{passed ? '🎉' : '📋'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{activeExam.name}</div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: passed ? 'var(--green)' : 'var(--coral)', margin: '14px 0' }}>{examResult.diemSo}/10</div>
          <div style={{ marginBottom: 18 }}>
            <span className={`stamp ${passed ? 'stamp-green' : 'stamp-gray'}`}>{examResult.ketQua}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-soft)', marginBottom: 24 }}>Đúng {examResult.soCauDung}/{examResult.tongCau} câu</div>
          <button className="btn-primary" onClick={backToExamList}>Quay lại danh sách đề thi</button>
        </div>
      </section>
    );
  }

  // ============ RENDER: DANH SÁCH ============
  return (
    <section className="page active">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--navy)', margin: '0 0 4px' }}>Bài test</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
            {mainTab === 'exams' ? 'Các đề thi năng lực thuộc phòng ban của bạn.' : 'Kết quả các bài test năng lực bạn đã làm.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button
            onClick={() => setMainTab('exams')}
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none', background: mainTab === 'exams' ? 'var(--surface)' : 'transparent', color: mainTab === 'exams' ? 'var(--navy)' : 'var(--text-soft)', boxShadow: mainTab === 'exams' ? 'var(--shadow)' : 'none' }}
          >
            Đề thi
          </button>
          <button
            onClick={() => setMainTab('results')}
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none', background: mainTab === 'results' ? 'var(--surface)' : 'transparent', color: mainTab === 'results' ? 'var(--navy)' : 'var(--text-soft)', boxShadow: mainTab === 'results' ? 'var(--shadow)' : 'none' }}
          >
            Kết quả
          </button>
        </div>
      </div>

      {mainTab === 'exams' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên đề thi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số câu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Thời gian</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {examsLoading ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải đề thi...</td></tr>
                ) : exams.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có đề thi nào cho phòng ban của bạn.</td></tr>
                ) : (
                  exams.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--navy)' }}>{ex.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{ex.maBoDe}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{ex.questionCount} câu</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{ex.duration} phút</td>
                      <td style={{ padding: '14px 16px' }}>
                        {ex.completed ? (
                          <span className={`stamp ${ex.result === 'Đạt' ? 'stamp-green' : 'stamp-gray'}`}>{ex.result} · {ex.score}/10</span>
                        ) : (
                          <span className="stamp stamp-gold">Chưa làm</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {ex.completed ? (
                          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Đã nộp {ex.takenAt}</span>
                        ) : (
                          <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => handleStartExam(ex)}>Bắt đầu làm bài</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mainTab === 'results' && (
        <>
          <div className="stat-grid" style={{ marginBottom: '18px' }}>
            <div className="stat-card">
              <div className="stat-value">{results.length}</div>
              <div className="stat-label">Tổng bài đã làm</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{passCount}</div>
              <div className="stat-label">Đạt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{avgScore}</div>
              <div className="stat-label">Điểm trung bình</div>
            </div>
          </div>

          <div className="panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bài test</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kết quả</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhận xét</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày làm</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsLoading ? (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải kết quả...</td></tr>
                  ) : results.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Bạn chưa có kết quả test năng lực nào.</td></tr>
                  ) : (
                    results.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--navy)' }}>{r.examName}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{r.score}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={r.ratingTier === 'pass' ? 'stamp stamp-green' : 'stamp stamp-gray'}>{r.result}</span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.note || 'Chưa có nhận xét'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.takenAt}</td>
                      </tr>
                    ))
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
