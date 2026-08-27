import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const DEPARTMENTS = ['Hành chính kế toán', 'Marketing', 'Đối ngoại', 'Hồ sơ', 'Đào tạo', 'Kinh doanh'];
const ANSWER_KEYS = ['A', 'B', 'C', 'D'];
const PRESET_COUNTS = [10, 20, 30, 40];

function emptyQuestion() {
  return { content: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '' };
}

export default function CompetencyTestBuilderPage({ examId, setCurrentPage }) {
  const isEdit = !!examId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [status, setStatus] = useState('active');
  const [questions, setQuestions] = useState([emptyQuestion()]);

  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`/api/competency-exams/${examId}`)
      .then(res => res.json())
      .then(d => {
        if (d.exam) {
          setName(d.exam.name || '');
          setDepartment(d.exam.department || DEPARTMENTS[0]);
          setStatus(d.exam.status || 'active');
          setQuestions((d.exam.questions || []).map(q => ({
            content: q.content, optionA: q.optionA, optionB: q.optionB,
            optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer
          })));
        }
        setLoading(false);
      })
      .catch(err => { console.error('Fetch error:', err); setLoading(false); });
  }, [examId]);

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => setQuestions(prev => prev.filter((_, i) => i !== index));

  const applyPresetCount = (target) => {
    setQuestions(prev => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        return [...prev, ...Array.from({ length: target - prev.length }, emptyQuestion)];
      }
      const trimmed = prev.slice(target);
      const hasContent = trimmed.some(q => q.content.trim() || q.optionA.trim() || q.optionB.trim() || q.optionC.trim() || q.optionD.trim() || q.correctAnswer);
      if (hasContent && !window.confirm(`Các câu hỏi từ câu ${target + 1} trở đi đã có nội dung. Cắt xuống còn ${target} câu sẽ xóa nội dung đó, bạn có chắc chắn?`)) {
        return prev;
      }
      return prev.slice(0, target);
    });
  };

  const handleSave = () => {
    if (!name.trim()) { alert('Vui lòng nhập tên đề thi!'); return; }
    if (questions.length === 0) { alert('Đề thi cần ít nhất 1 câu hỏi!'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        alert(`Vui lòng nhập đầy đủ nội dung và 4 đáp án cho câu hỏi ${i + 1}!`);
        return;
      }
      if (!q.correctAnswer) {
        alert(`Vui lòng chọn đáp án đúng cho câu hỏi ${i + 1}!`);
        return;
      }
    }

    setSaving(true);
    const url = isEdit ? `/api/competency-exams/${examId}` : '/api/competency-exams';
    const method = isEdit ? 'PUT' : 'POST';
    apiFetch(url, { method, body: JSON.stringify({ name, department, status, questions }) })
      .then(res => res.json())
      .then(data => {
        setSaving(false);
        if (data.success) {
          setCurrentPage('competency');
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSaving(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  if (loading) {
    return (
      <section className="page active">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải đề thi...</div>
      </section>
    );
  }

  return (
    <section className="page active">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
        <div>
          <button
            onClick={() => setCurrentPage('competency')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-soft)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Quay lại danh sách đề thi
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--navy)', margin: 0 }}>
            {isEdit ? 'Sửa đề thi' : 'Tạo đề thi mới'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => setCurrentPage('competency')}>Hủy</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu đề thi'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: '22px', marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên đề thi *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Bộ đề Test Năng Lực Trưởng Phòng Kinh Doanh" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Phòng ban</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: '18px 22px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text)' }}>Chọn nhanh số câu hỏi:</span>
        {PRESET_COUNTS.map(count => (
          <div
            key={count}
            className={`chip ${questions.length === count ? 'active' : ''}`}
            onClick={() => applyPresetCount(count)}
          >
            {count} câu
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: 'var(--text-faint)' }}>Hiện có {questions.length} câu hỏi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {questions.map((q, index) => (
          <div key={index} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontWeight: '700', color: 'var(--navy)', fontSize: '14px' }}>Câu hỏi {index + 1}</div>
              <button
                onClick={() => removeQuestion(index)}
                title="Xóa câu hỏi"
                style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>

            <textarea
              value={q.content}
              onChange={e => updateQuestion(index, 'content', e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', marginBottom: '14px', resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ANSWER_KEYS.map(key => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuestion(index, 'correctAnswer', key)}
                    title="Đánh dấu là đáp án đúng"
                    style={{
                      width: '28px', height: '28px', flex: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      border: q.correctAnswer === key ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
                      background: q.correctAnswer === key ? 'var(--green-soft)' : 'var(--bg)',
                      color: q.correctAnswer === key ? 'var(--green)' : 'var(--text-soft)'
                    }}
                  >
                    {key}
                  </button>
                  <input
                    value={q[`option${key}`]}
                    onChange={e => updateQuestion(index, `option${key}`, e.target.value)}
                    placeholder={`Đáp án ${key}`}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '9px', border: '1.5px solid var(--border)', fontSize: '13px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="btn-ghost"
        style={{ marginTop: '14px', width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
        Thêm câu hỏi
      </button>
    </section>
  );
}
