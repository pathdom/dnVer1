import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const RESULT_OPTIONS = ['Đạt', 'Không đạt'];
const QUESTION_SIZES = [10, 20, 30, 40];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const removeAccents = (str) => (str || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

function emptyAnswer() { return { content: '', isCorrect: false }; }
function emptyQuestion() { return { content: '', answers: [emptyAnswer(), emptyAnswer(), emptyAnswer(), emptyAnswer()] }; }
function emptyExamForm() { return { id: null, tenDe: '', boPhanId: '', duration: 45, passScore: 8, questions: [] }; }

export default function CompetencyTestPage() {
  const [mainTab, setMainTab] = useState('exams'); // 'exams' | 'results'
  const [boPhan, setBoPhan] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };

  useEffect(() => {
    apiFetch('/api/lookups').then(res => res.json()).then(d => setBoPhan(d.boPhan || [])).catch(() => {});
    apiFetch('/api/employees').then(res => res.json()).then(d => setEmployees(d.employees || [])).catch(() => {});
  }, []);

  // ============ ĐỀ THI ============
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examView, setExamView] = useState('list'); // 'list' | 'builder'
  const [examForm, setExamForm] = useState(emptyExamForm());
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examDeptFilter, setExamDeptFilter] = useState('all');

  const fetchExams = () => {
    setExamsLoading(true);
    apiFetch('/api/exams')
      .then(res => res.json())
      .then(d => { setExams(d.exams || []); setExamsLoading(false); })
      .catch(err => { console.error(err); setExamsLoading(false); });
  };

  useEffect(() => { fetchExams(); }, []);

  const openCreateExam = () => {
    setExamForm(emptyExamForm());
    setExamView('builder');
  };

  const openEditExam = (exam) => {
    apiFetch(`/api/exams/${exam.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) return alert(d.error);
        setExamForm({
          id: d.id,
          tenDe: d.name,
          boPhanId: d.boPhanId || '',
          duration: d.duration,
          passScore: d.passScore,
          questions: d.questions.map(q => ({
            content: q.content,
            answers: q.answers.length ? q.answers.map(a => ({ content: a.content, isCorrect: a.isCorrect })) : [emptyAnswer(), emptyAnswer(), emptyAnswer(), emptyAnswer()]
          }))
        });
        setExamView('builder');
      })
      .catch(err => alert('Lỗi tải đề thi: ' + err.message));
  };

  const handleDeleteExam = (exam) => {
    if (!window.confirm(`Xóa đề thi "${exam.name}" (${exam.maBoDe})? Toàn bộ câu hỏi và đáp án sẽ bị xóa theo.`)) return;
    apiFetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) { showToast(data.message || 'Đã xóa đề thi'); fetchExams(); }
        else alert(data.error || 'Lỗi khi xóa đề thi');
      })
      .catch(err => alert('Lỗi máy chủ: ' + err.message));
  };

  const setQuestionCount = (size) => {
    const current = examForm.questions.length;
    if (size < current) {
      if (!window.confirm(`Đề đang có ${current} câu, thu nhỏ về ${size} câu sẽ xóa ${current - size} câu cuối. Tiếp tục?`)) return;
      setExamForm(prev => ({ ...prev, questions: prev.questions.slice(0, size) }));
    } else if (size > current) {
      const toAdd = Array.from({ length: size - current }, () => emptyQuestion());
      setExamForm(prev => ({ ...prev, questions: [...prev.questions, ...toAdd] }));
    }
  };

  const addQuestion = () => setExamForm(prev => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  const removeQuestion = (index) => setExamForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  const updateQuestionContent = (index, content) => {
    setExamForm(prev => ({ ...prev, questions: prev.questions.map((q, i) => i === index ? { ...q, content } : q) }));
  };
  const updateAnswerContent = (qIndex, aIndex, content) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIndex
        ? { ...q, answers: q.answers.map((a, j) => j === aIndex ? { ...a, content } : a) }
        : q)
    }));
  };
  const setCorrectAnswer = (qIndex, aIndex) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIndex
        ? { ...q, answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIndex })) }
        : q)
    }));
  };

  const handleSaveExam = (e) => {
    e.preventDefault();
    if (!examForm.tenDe.trim()) return alert('Vui lòng nhập tên đề thi');
    if (examForm.questions.length === 0) return alert('Vui lòng chọn số lượng câu hỏi hoặc thêm câu hỏi');
    for (let i = 0; i < examForm.questions.length; i++) {
      const q = examForm.questions[i];
      if (!q.content.trim()) return alert(`Vui lòng nhập nội dung cho câu hỏi ${i + 1}`);
      if (q.answers.some(a => !a.content.trim())) return alert(`Vui lòng nhập đủ 4 đáp án cho câu hỏi ${i + 1}`);
      if (!q.answers.some(a => a.isCorrect)) return alert(`Vui lòng đánh dấu đáp án đúng cho câu hỏi ${i + 1}`);
    }

    setExamSubmitting(true);
    const isEdit = !!examForm.id;
    const url = isEdit ? `/api/exams/${examForm.id}` : '/api/exams';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examForm)
    })
      .then(res => res.json())
      .then(data => {
        setExamSubmitting(false);
        if (data.success) {
          setExamView('list');
          showToast(data.message || (isEdit ? 'Đã cập nhật đề thi' : 'Đã tạo đề thi'));
          fetchExams();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setExamSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const examDepartments = [...new Set(exams.map(e => e.department).filter(Boolean))];
  const filteredExams = exams.filter(e => examDeptFilter === 'all' || e.department === examDeptFilter);

  // ============ KẾT QUẢ (giữ nguyên logic cũ) ============
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = () => ({
    employeeId: employees[0]?.dbId || '',
    examName: '',
    score: '',
    result: RESULT_OPTIONS[0],
    takenAt: new Date().toISOString().slice(0, 10),
    note: ''
  });
  const [formData, setFormData] = useState(emptyForm());

  const fetchResults = () => {
    setResultsLoading(true);
    apiFetch('/api/competency-results')
      .then(res => res.json())
      .then(d => { setResults(d.results || []); setResultsLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setResultsLoading(false); });
  };

  useEffect(() => { fetchResults(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      examName: item.examName || '',
      score: item.score,
      result: item.result || RESULT_OPTIONS[0],
      takenAt: item.takenAtRaw || new Date().toISOString().slice(0, 10),
      note: item.note || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kết quả "${item.examName}" của ${item.employeeName}?`)) {
      apiFetch(`/api/competency-results/${item.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast(data.message || 'Đã xóa kết quả');
            fetchResults();
          } else {
            alert(data.error || 'Lỗi khi xóa kết quả');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId) { alert('Vui lòng chọn nhân viên!'); return; }
    if (!formData.examName.trim()) { alert('Vui lòng nhập tên bài test!'); return; }

    setSubmitting(true);
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/competency-results/${editingItem.id}` : '/api/competency-results';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          showToast(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm kết quả thành công!'));
          fetchResults();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const resultDepartments = [...new Set(results.map(r => r.department))];

  const filteredResults = results.filter(r => {
    const matchDept = deptFilter === 'all' || r.department === deptFilter;
    let matchSearch = true;
    if (search.trim()) {
      const q = removeAccents(search);
      matchSearch = [r.employeeName, r.examName, r.employeeCode].some(v => removeAccents(v).includes(q));
    }
    return matchDept && matchSearch;
  });

  const passCount = results.filter(r => r.result === 'Đạt').length;
  const failCount = results.filter(r => r.result === 'Không đạt').length;
  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : '0';

  return (
    <section className="page active">
      <Topbar
        eyebrow={mainTab === 'exams' ? `${exams.length} đề thi CSDL` : `${results.length} lượt làm bài CSDL`}
        title="Bài test"
        subtitle={mainTab === 'exams' ? 'Ngân hàng đề thi trắc nghiệm — mỗi câu hỏi có sẵn đáp án đúng để chấm tự động.' : 'Kết quả bài test năng lực được nhập thủ công sau khi chấm cho từng nhân viên.'}
        rightAction={
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
        }
      />

      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      {/* ================= TAB: ĐỀ THI ================= */}
      {mainTab === 'exams' && examView === 'list' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn-primary" onClick={openCreateExam}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Thêm bài test
            </button>
          </div>

          <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div className={`chip ${examDeptFilter === 'all' ? 'active' : ''}`} onClick={() => setExamDeptFilter('all')}>Tất cả ({exams.length})</div>
            {examDepartments.map(dep => (
              <div key={dep} className={`chip ${examDeptFilter === dep ? 'active' : ''}`} onClick={() => setExamDeptFilter(dep)}>
                {dep} ({exams.filter(e => e.department === dep).length})
              </div>
            ))}
          </div>

          <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên đề thi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phòng ban</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số câu</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Thời gian</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm chuẩn đạt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Lượt làm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày tạo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {examsLoading ? (
                    <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải đề thi...</td></tr>
                  ) : filteredExams.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có đề thi nào.</td></tr>
                  ) : (
                    filteredExams.map((ex) => (
                      <tr key={ex.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{ex.name}</div>
                          <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{ex.maBoDe}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--navy)' }}>{ex.department || 'Chưa xác định'}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{ex.questionCount} câu</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{ex.duration} phút</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{Number(ex.passScore).toFixed(1)}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{ex.attemptCount}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{ex.createdAt}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button className="row-action" title="Sửa đề thi" onClick={() => openEditExam(ex)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="row-action" title="Xóa đề thi" onClick={() => handleDeleteExam(ex)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
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
      )}

      {/* ================= TAB: ĐỀ THI — BUILDER ================= */}
      {mainTab === 'exams' && examView === 'builder' && (
        <form onSubmit={handleSaveExam}>
          <button type="button" className="breadcrumb" onClick={() => setExamView('list')} style={{ cursor: 'pointer', marginBottom: 12 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Quay lại danh sách đề thi
          </button>

          <div className="panel" style={{ padding: '22px 24px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên đề thi *</label>
                <input value={examForm.tenDe} onChange={e => setExamForm({ ...examForm, tenDe: e.target.value })} placeholder="VD: Kiểm tra quy trình Visa Du học Nhật 2026" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Phòng ban</label>
                <select value={examForm.boPhanId} onChange={e => setExamForm({ ...examForm, boPhanId: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  <option value="">Chưa xác định</option>
                  {boPhan.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Thời gian làm bài (phút)</label>
                <input type="number" min="1" value={examForm.duration} onChange={e => setExamForm({ ...examForm, duration: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Điểm chuẩn đạt (/10)</label>
                <input type="number" step="0.1" min="0" max="10" value={examForm.passScore} onChange={e => setExamForm({ ...examForm, passScore: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Chọn nhanh số lượng câu hỏi</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUESTION_SIZES.map(size => (
                <div key={size} className={`chip ${examForm.questions.length === size ? 'active' : ''}`} onClick={() => setQuestionCount(size)}>{size} câu</div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: '22px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16.5, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>Câu hỏi ({examForm.questions.length})</h3>
            </div>

            {examForm.questions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>Chọn số lượng câu hỏi ở trên hoặc bấm "Thêm câu hỏi" bên dưới.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {examForm.questions.map((q, qIndex) => (
                  <div key={qIndex} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--navy)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{qIndex + 1}</div>
                      <textarea
                        value={q.content}
                        onChange={e => updateQuestionContent(qIndex, e.target.value)}
                        placeholder={`Nội dung câu hỏi ${qIndex + 1}`}
                        rows={2}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical' }}
                      />
                      <button type="button" className="row-action" title="Xóa câu hỏi" onClick={() => removeQuestion(qIndex)} style={{ color: 'var(--coral)', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginLeft: 36 }}>
                      {q.answers.map((a, aIndex) => (
                        <div key={aIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 20, fontSize: 12.5, fontWeight: 700, color: 'var(--text-faint)', flexShrink: 0 }}>{ANSWER_LABELS[aIndex]}</span>
                          <input
                            value={a.content}
                            onChange={e => updateAnswerContent(qIndex, aIndex, e.target.value)}
                            placeholder={`Đáp án ${ANSWER_LABELS[aIndex]}`}
                            style={{ flex: 1, padding: '8px 11px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13 }}
                          />
                          <button
                            type="button"
                            onClick={() => setCorrectAnswer(qIndex, aIndex)}
                            className={`chip ${a.isCorrect ? 'active' : ''}`}
                            style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11, ...(a.isCorrect ? { background: 'var(--green)', borderColor: 'var(--green)' } : {}) }}
                          >
                            {a.isCorrect ? '✓ Đúng' : 'Đánh dấu đúng'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={addQuestion} className="btn-ghost" style={{ marginTop: 14, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Thêm câu hỏi
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn-ghost" onClick={() => setExamView('list')}>Hủy</button>
            <button type="submit" disabled={examSubmitting} className="btn-primary">
              {examSubmitting ? 'Đang lưu CSDL...' : examForm.id ? 'Lưu thay đổi CSDL' : 'Lưu đề thi vào CSDL'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB: KẾT QUẢ ================= */}
      {mainTab === 'results' && (
        <>
          <div className="stat-grid" style={{ marginBottom: '18px' }}>
            <div className="stat-card">
              <div className="stat-value">{results.length}</div>
              <div className="stat-label">Tổng lượt làm bài</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{passCount}</div>
              <div className="stat-label">Đạt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{failCount}</div>
              <div className="stat-label">Không đạt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{avgScore}</div>
              <div className="stat-label">Điểm trung bình</div>
            </div>
          </div>

          <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className={`chip ${deptFilter === 'all' ? 'active' : ''}`} onClick={() => setDeptFilter('all')}>Tất cả ({results.length})</div>
              {resultDepartments.map(dep => (
                <div key={dep} className={`chip ${deptFilter === dep ? 'active' : ''}`} onClick={() => setDeptFilter(dep)}>
                  {dep} ({results.filter(r => r.department === dep).length})
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <div className="filter-search" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '260px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Tìm tên nhân viên, bài test..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }} />
              </div>
              <button className="btn-primary" onClick={handleOpenAddModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
                Thêm kết quả
              </button>
            </div>
          </div>

          <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhân viên</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bài test</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kết quả</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhận xét</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày làm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsLoading ? (
                    <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải kết quả...</td></tr>
                  ) : filteredResults.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có kết quả nào phù hợp.</td></tr>
                  ) : (
                    filteredResults.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initialsOf(r.employeeName)}</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{r.employeeName}</div>
                              <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{r.department}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-soft)' }}>{r.examName}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{r.score}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={r.ratingTier === 'pass' ? 'stamp stamp-visa' : 'stamp stamp-leave'}>{r.result}</span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span title={r.note || 'Chưa có nhận xét'}>{r.note || 'Chưa có nhận xét'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.takenAt}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button className="row-action" title="Chỉnh sửa" onClick={() => handleOpenEditModal(r)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="row-action" title="Xóa" onClick={() => handleDelete(r)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
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
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingItem ? '✏️ Chỉnh sửa kết quả' : '➕ Thêm kết quả test năng lực'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhân viên *</label>
                <select name="employeeId" value={formData.employeeId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  {employees.map(e => <option key={e.dbId} value={e.dbId}>{e.name} ({e.id})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên bài test *</label>
                <input name="examName" value={formData.examName} onChange={handleInputChange} placeholder="VD: Kỹ năng tư vấn du học Nhật Bản" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Điểm số</label>
                  <input type="number" step="0.1" min="0" max="10" name="score" value={formData.score} onChange={handleInputChange} placeholder="8.5" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Kết quả</label>
                  <select name="result" value={formData.result} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày làm</label>
                <input type="date" name="takenAt" value={formData.takenAt} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhận xét</label>
                <input name="note" value={formData.note} onChange={handleInputChange} placeholder="Nhận xét thêm (không bắt buộc)" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingItem ? 'Lưu thay đổi CSDL' : 'Lưu vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
