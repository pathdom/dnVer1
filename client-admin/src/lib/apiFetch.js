const BASE_URL = import.meta.env.VITE_API_URL || '';

// Nối BASE_URL vào trước 1 đường dẫn tương đối (vd: /uploads/avatars/x.jpg)
// để ảnh vẫn tải đúng từ backend khi frontend và backend khác domain (Vercel + 1Panel).
export function resolveUrl(path) {
  if (!path) return path;
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('aladdin_token');
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers = {
    ...(opts.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers
  };

  const res = await fetch(resolveUrl(path), { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_admin');
    window.location.reload();
  }

  return res;
}
