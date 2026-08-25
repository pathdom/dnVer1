import { apiFetch } from '../lib/apiFetch';

async function json(res) {
  if (!res.ok) {
    let message = 'Lỗi máy chủ';
    try { const d = await res.json(); message = d.error || message; } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json();
}

export const chatApi = {
  people: () => apiFetch('/api/chat/people').then(json),

  conversations: () => apiFetch('/api/chat/conversations').then(json),
  createDm: (participant) => apiFetch('/api/chat/conversations', {
    method: 'POST', body: JSON.stringify({ participant })
  }).then(json),
  createGroup: (name, participants) => apiFetch('/api/chat/conversations', {
    method: 'POST', body: JSON.stringify({ kind: 'group', name, participants })
  }).then(json),
  pinConversation: (id) => apiFetch(`/api/chat/conversations/${id}/pin`, { method: 'PATCH' }).then(json),
  leaveConversation: (id) => apiFetch(`/api/chat/conversations/${id}`, { method: 'DELETE' }).then(json),
  markRead: (id) => apiFetch(`/api/chat/conversations/${id}/read`, { method: 'PATCH' }).then(json),

  messages: (id, before) => apiFetch(`/api/chat/conversations/${id}/messages${before ? '?before=' + before : ''}`).then(json),
  sendMessage: (id, { text, replyToId, file }) => {
    const form = new FormData();
    if (text) form.append('text', text);
    if (replyToId) form.append('replyToId', String(replyToId));
    if (file) form.append('attachment', file);
    return apiFetch(`/api/chat/conversations/${id}/messages`, { method: 'POST', body: form }).then(json);
  },
  editMessage: (id, text) => apiFetch(`/api/chat/messages/${id}`, {
    method: 'PATCH', body: JSON.stringify({ text })
  }).then(json),
  deleteMessage: (id) => apiFetch(`/api/chat/messages/${id}`, { method: 'DELETE' }).then(json),
  pinMessage: (id) => apiFetch(`/api/chat/messages/${id}/pin`, { method: 'POST' }).then(json),
  saveMessage: (id) => apiFetch(`/api/chat/messages/${id}/save`, { method: 'POST' }).then(json),
  saved: () => apiFetch('/api/chat/saved').then(json),
  react: (id, emoji) => apiFetch(`/api/chat/messages/${id}/react`, {
    method: 'POST', body: JSON.stringify({ emoji })
  }).then(json),

  thread: (id) => apiFetch(`/api/chat/messages/${id}/thread`).then(json),
  replyThread: (id, text) => apiFetch(`/api/chat/messages/${id}/thread`, {
    method: 'POST', body: JSON.stringify({ text })
  }).then(json),

  search: (q) => apiFetch(`/api/chat/search?q=${encodeURIComponent(q)}`).then(json)
};
