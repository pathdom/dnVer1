export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('aladdin_token');
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers = {
    ...(opts.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers
  };

  const res = await fetch(path, { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_admin');
    window.location.reload();
  }

  return res;
}
