import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const STORAGE_KEY = 'aladdin_process_flows';
const GROUPS = ['Du học', 'Thực tập sinh', 'Xuất cảnh', 'Nội bộ'];
const STEP_TYPES = [
  { value: 'work', label: 'Công việc', stampClass: 'stamp-new' },
  { value: 'approve', label: 'Phê duyệt', stampClass: 'stamp-visa' },
  { value: 'notify', label: 'Thông báo', stampClass: 'stamp-hold' }
];

function loadFlows() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveFlows(flows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function emptyStep() { return { id: newId(), name: '', type: 'work', owner: 'Chưa phân công', slaDays: 3 }; }
function emptyFlow() { return { id: newId(), name: '', description: '', group: GROUPS[0], steps: [emptyStep()] }; }
function stepTypeInfo(value) { return STEP_TYPES.find(t => t.value === value) || STEP_TYPES[0]; }
function totalDays(flow) { return flow.steps.reduce((sum, s) => sum + (Number(s.slaDays) || 0), 0); }

function defaultFlow() {
  return {
    id: newId(),
    name: 'Quy trình du học Nhật Bản',
    description: 'Từ tiếp nhận khách đến khi học viên nhập học',
    group: 'Du học',
    steps: [
      { id: newId(), name: 'Tiếp nhận & phân công', type: 'work', owner: 'Marketing', slaDays: 3 },
      { id: newId(), name: 'Tư vấn & ký hợp đồng', type: 'work', owner: 'Marketing', slaDays: 7 },
      { id: newId(), name: 'Học tiếng', type: 'work', owner: 'Đào tạo', slaDays: 150 },
      { id: newId(), name: 'Thẩm định & visa', type: 'approve', owner: 'Đối ngoại', slaDays: 30 },
      { id: newId(), name: 'Nhập học', type: 'notify', owner: 'Đối ngoại', slaDays: 14 }
    ]
  };
}

export default function ProcessFlowPage() {
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [tab, setTab] = useState('view');
  const [form, setForm] = useState(emptyFlow());
  const [boPhan, setBoPhan] = useState([]);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  useEffect(() => {
    let loaded = loadFlows();
    if (loaded.length === 0) {
      loaded = [defaultFlow()];
      saveFlows(loaded);
    }
    setFlows(loaded);
    setSelectedFlowId(loaded[0].id);
    apiFetch('/api/lookups').then(res => res.json()).then(d => setBoPhan(d.boPhan || [])).catch(() => {});
  }, []);

  const selectedFlow = flows.find(f => f.id === selectedFlowId) || null;
  const persist = (next) => { setFlows(next); saveFlows(next); };

  const openCreate = () => { setForm(emptyFlow()); setTab('builder'); };
  const openEdit = (flow) => { setForm(JSON.parse(JSON.stringify(flow))); setTab('builder'); };

  const handleDelete = (flow) => {
    if (!window.confirm(`Xóa quy trình "${flow.name}"? Dữ liệu chỉ lưu trên trình duyệt này, không thể khôi phục.`)) return;
    const next = flows.filter(f => f.id !== flow.id);
    persist(next);
    if (selectedFlowId === flow.id) setSelectedFlowId(next[0]?.id || null);
  };

  const handleSendNotification = (flow) => {
    setSending(true);
    apiFetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doiTuong: 'staff',
        tieuDe: `Quy trình mới: ${flow.name}`,
        noiDung: `Quy trình "${flow.name}" (${flow.steps.length} bước, tổng thời hạn ${totalDays(flow)} ngày) đã được cập nhật. Vào mục Quy trình xử lý để xem chi tiết.`,
        loai: 'quy_trinh',
        duLieu: flow
      })
    })
      .then(res => res.json())
      .then(data => {
        setSending(false);
        if (data.success) showToast('✅ Đã gửi thông báo đến nhân viên');
        else alert(data.error || 'Có lỗi xảy ra');
      })
      .catch(err => { setSending(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Vui lòng nhập tên quy trình');
    if (form.steps.length === 0) return alert('Quy trình cần ít nhất 1 bước');
    if (form.steps.some(s => !s.name.trim())) return alert('Vui lòng nhập tên cho tất cả các bước');

    const exists = flows.some(f => f.id === form.id);
    const next = exists ? flows.map(f => (f.id === form.id ? form : f)) : [...flows, form];
    persist(next);
    setSelectedFlowId(form.id);
    setTab('view');
  };

  const updateStep = (stepId, patch) => {
    setForm(prev => ({ ...prev, steps: prev.steps.map(s => (s.id === stepId ? { ...s, ...patch } : s)) }));
  };
  const addStep = () => setForm(prev => ({ ...prev, steps: [...prev.steps, emptyStep()] }));
  const removeStep = (stepId) => setForm(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== stepId) }));
  const moveStep = (index, dir) => {
    setForm(prev => {
      const steps = [...prev.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return prev;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...prev, steps };
    });
  };

  const ownerOptions = ['Chưa phân công', ...boPhan.map(b => b.name)];

  return (
    <section className="page active">
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 12px 30px rgba(15,20,35,0.25)', zIndex: 2000 }}>
          <span>{toastMessage}</span>
        </div>
      )}
      <Topbar
        eyebrow={`${flows.length} quy trình đã lưu trên trình duyệt`}
        title="Quy trình xử lý hồ sơ"
        subtitle="Sơ đồ các bước xử lý — chỉ lưu trên máy này, không đồng bộ CSDL."
        rightAction={
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setTab('view')}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'view' ? 'var(--surface)' : 'transparent', color: tab === 'view' ? 'var(--navy)' : 'var(--text-soft)', boxShadow: tab === 'view' ? 'var(--shadow)' : 'none' }}
            >
              Sơ đồ quy trình
            </button>
            <button
              onClick={openCreate}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'builder' ? 'var(--surface)' : 'transparent', color: tab === 'builder' ? 'var(--navy)' : 'var(--text-soft)', boxShadow: tab === 'builder' ? 'var(--shadow)' : 'none' }}
            >
              Tạo quy trình mới
            </button>
          </div>
        }
      />

      {tab === 'view' && (
        flows.length === 0 ? (
          <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🧭</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Chưa có quy trình nào</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-soft)', maxWidth: 420, margin: '0 auto 18px' }}>
              Tạo sơ đồ các bước xử lý hồ sơ để tham khảo nội bộ. Dữ liệu chỉ lưu trên trình duyệt này.
            </p>
            <button className="btn-primary" onClick={openCreate}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Tạo quy trình mới
            </button>
          </div>
        ) : (
          <>
            <div className="filter-bar">
              {flows.map(f => (
                <div key={f.id} className={`chip ${selectedFlowId === f.id ? 'active' : ''}`} onClick={() => setSelectedFlowId(f.id)}>
                  {f.name || 'Chưa đặt tên'}
                </div>
              ))}
            </div>

            {selectedFlow && (
              <>
                <div className="panel" style={{ padding: '20px 22px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--navy)' }}>{selectedFlow.name}</h2>
                        <span className="dept-tag">{selectedFlow.group}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>{selectedFlow.description || 'Chưa có mô tả'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn-ghost" disabled={sending} onClick={() => handleSendNotification(selectedFlow)} style={{ padding: '8px 14px', fontSize: 12.5 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        {sending ? 'Đang gửi...' : 'Gửi thông báo cho nhân viên'}
                      </button>
                      <button className="row-action" title="Sửa quy trình" onClick={() => openEdit(selectedFlow)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="row-action" title="Xóa quy trình" onClick={() => handleDelete(selectedFlow)} style={{ color: 'var(--coral)' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 18, marginBottom: 0 }}>
                    <div className="stat-card" style={{ boxShadow: 'none', padding: 14 }}>
                      <div className="stat-value" style={{ fontSize: 22 }}>{selectedFlow.steps.length}</div>
                      <div className="stat-label">Số bước trong quy trình</div>
                    </div>
                    <div className="stat-card" style={{ boxShadow: 'none', padding: 14 }}>
                      <div className="stat-value" style={{ fontSize: 22 }}>{totalDays(selectedFlow)} ngày</div>
                      <div className="stat-label">Tổng thời hạn dự kiến</div>
                    </div>
                    <div className="stat-card" style={{ boxShadow: 'none', padding: 14 }}>
                      <div className="stat-value" style={{ fontSize: 22 }}>{selectedFlow.group}</div>
                      <div className="stat-label">Nhóm quy trình</div>
                    </div>
                  </div>
                </div>

                <div className="panel" style={{ padding: '20px 22px', marginBottom: 16, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 'max-content' }}>
                    <span className="dept-tag" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>BẮT ĐẦU</span>
                    {selectedFlow.steps.map((step, i) => {
                      const typeInfo = stepTypeInfo(step.type);
                      return (
                        <React.Fragment key={step.id}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                          <div style={{ width: 168, flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--teal-soft)', color: 'var(--teal)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                              <span className={`stamp ${typeInfo.stampClass}`} style={{ transform: 'none', padding: '3px 7px', fontSize: 9 }}>{typeInfo.label}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6, lineHeight: 1.3 }}>{step.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{step.owner} · {step.slaDays} ngày</div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    <span className="dept-tag" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>KẾT THÚC</span>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><h3>Chi tiết các bước</h3></div>
                  <div className="panel-body">
                    <table className="table">
                      <thead>
                        <tr><th>Bước</th><th>Loại</th><th>Phụ trách</th><th style={{ textAlign: 'right' }}>Thời hạn</th></tr>
                      </thead>
                      <tbody>
                        {selectedFlow.steps.map((step, i) => {
                          const typeInfo = stepTypeInfo(step.type);
                          return (
                            <tr key={step.id}>
                              <td>
                                <div className="cell-person">
                                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{i + 1}</div>
                                  <div className="cell-name">{step.name}</div>
                                </div>
                              </td>
                              <td><span className={`stamp ${typeInfo.stampClass}`}>{typeInfo.label}</span></td>
                              <td><span className="dept-tag">{step.owner}</span></td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{step.slaDays} ngày</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )
      )}

      {tab === 'builder' && (
        <form onSubmit={handleSave}>
          <div className="panel" style={{ padding: '22px 24px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 16, marginBottom: 6 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên quy trình *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Quy trình du học Hàn Quốc" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Mô tả ngắn</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Từ tiếp nhận đến khi học viên nhập học" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhóm</label>
                <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '22px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16.5, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>Các bước ({form.steps.length})</h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Tổng thời hạn {totalDays(form)} ngày</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.steps.map((step, i) => (
                <div key={step.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 150px 170px 90px auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--navy)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <input value={step.name} onChange={e => updateStep(step.id, { name: e.target.value })} placeholder="Tên bước" style={{ padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13 }} />
                  <select value={step.type} onChange={e => updateStep(step.id, { type: e.target.value })} style={{ padding: '9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 12.5, background: '#fff' }}>
                    {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select value={step.owner} onChange={e => updateStep(step.id, { owner: e.target.value })} style={{ padding: '9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 12.5, background: '#fff' }}>
                    {ownerOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input type="number" min="0" value={step.slaDays} onChange={e => updateStep(step.id, { slaDays: e.target.value })} placeholder="Ngày" style={{ padding: '9px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'var(--font-mono)' }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="row-action" title="Lên trên" disabled={i === 0} onClick={() => moveStep(i, -1)} style={{ opacity: i === 0 ? 0.3 : 1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    </button>
                    <button type="button" className="row-action" title="Xuống dưới" disabled={i === form.steps.length - 1} onClick={() => moveStep(i, 1)} style={{ opacity: i === form.steps.length - 1 ? 0.3 : 1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </button>
                    <button type="button" className="row-action" title="Xóa bước" onClick={() => removeStep(step.id)} style={{ color: 'var(--coral)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addStep} className="btn-ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Thêm bước
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn-ghost" onClick={() => setTab('view')}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu quy trình</button>
          </div>
        </form>
      )}
    </section>
  );
}
