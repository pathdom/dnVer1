import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const RATING_STAMP = {
  excellent: 'stamp stamp-green',
  pass: 'stamp stamp-blue',
  'needs-improvement': 'stamp stamp-gold',
  fail: 'stamp stamp-gray'
};

const ANSWER_KEYS = ['A', 'B', 'C', 'D'];

export default function StaffCompetencyPage() {
  const [exams, setExams] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeExam, setActiveExam] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchExams = () => {
    setLoading(true);
    apiFetch('/api/staff/competency-exams')
      .then(res => res.json())
      .then(d => { setExams(d.exams || []); setDepartment(d.department || null); setLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setLoading(false); });
  };

  useEffect(() => { fetchExams(); }, []);

  const handleStart = (exam) => {
    setLoadingExam(true);
    setResult(null);
    apiFetch(`/api/staff/competency-exams/${exam.id}`)
      .then(res => res.json())
      .then(d => {
        setLoadingExam(false);
        if (d.exam) {
          setActiveExam(d.exam);
          setAnswers({});
        } else {
          alert(d.error || 'Không thể tải đề thi');
        }
      })
      .catch(err => { setLoadingExam(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const handleAnswer = (questionId, key) => {
    setAnswers(prev => ({ ...prev, [questionId]: key }));
  };

  const handleSubmit = () => {
    if (!activeExam) return;
    const unanswered = activeExam.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`Bạn còn ${unanswered.length} câu chưa trả lời. Vẫn muốn nộp bài?`)) return;
    }
    setSubmitting(true);
    apiFetch(`/api/staff/competency-exams/${activeExam.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setResult(data);
        } else {
          alert(data.error || 'Không thể nộp bài');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const handleBackToList = () => {
    setActiveExam(null);
    setResult(null);
    setAnswers({});
    fetchExams();
  };

  if (result) {
    return (
      <section className="page active">
        <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: '40px', textAlign: 'center', maxWidth: '480px', margin: '40px auto' }}>
          <div style={{ fontSize: '15px', color: 'var(--text-soft)', marginBottom: '6px' }}>Kết quả bài làm</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: '700', color: 'var(--navy)', margin: '10px 0' }}>
            {result.correct}/{result.total}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <span className={RATING_STAMP[result.ratingTier]}>{result.rating}</span>
          </div>
          <button className="btn-primary" onClick={handleBackToList}>Quay lại danh sách</button>
        </div>
      </section>
    );
  }

  if (activeExam) {
    return (
      <section className="page active">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
          <div>
            <button
              onClick={() => setActiveExam(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-soft)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Quay lại danh sách
            </button>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', color: 'var(--navy)', margin: 0 }}>{activeExam.name}</h1>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeExam.questions.map((q, index) => (
            <div key={q.id} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: '20px 22px' }}>
              <div style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '14px', marginBottom: '12px' }}>
                Câu {index + 1}. {q.content}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ANSWER_KEYS.map(key => (
                  <button
                    key={key}
                    onClick={() => handleAnswer(q.id, key)}
                    style={{
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                      border: answers[q.id] === key ? '1.5px solid var(--teal)' : '1.5px solid var(--border)',
                      background: answers[q.id] === key ? 'var(--teal-soft)' : 'var(--bg)',
                      color: answers[q.id] === key ? 'var(--teal)' : 'var(--text)'
                    }}
                  >
                    <span style={{ fontWeight: '700', flex: 'none' }}>{key}.</span>
                    <span>{q[`option${key}`]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ marginTop: '16px', width: '100%', padding: '14px' }}>
          {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
        </button>
      </section>
    );
  }

  return (
    <section className="page active">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--navy)', margin: '0 0 4px' }}>Test năng lực nhân viên</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
          {department ? `Các bộ đề dành cho phòng ${department}` : 'Chưa xác định phòng ban của bạn'}
        </div>
      </div>

      {loadingExam ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải đề thi...</div>
      ) : (
        <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên đề thi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số câu</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải danh sách đề thi...</td></tr>
                ) : exams.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Hiện chưa có đề thi nào dành cho phòng ban của bạn.</td></tr>
                ) : (
                  exams.map(exam => (
                    <tr key={exam.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--navy)' }}>{exam.name}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{exam.questionCount}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {exam.completed ? (
                          <span className={RATING_STAMP[exam.ratingTier]}>{exam.rating} · {exam.correct}/{exam.total}</span>
                        ) : (
                          <span className="stamp stamp-teal">Chưa làm</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {exam.completed ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Đã hoàn thành {exam.takenAt}</span>
                        ) : (
                          <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '12.5px' }} onClick={() => handleStart(exam)}>
                            Bắt đầu làm bài
                          </button>
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
    </section>
  );
}
