export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('aladdin_token');
  const headers = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers
  };

  const res = await fetch(path, { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_student');
    window.location.reload();
  }

  return res;
}
