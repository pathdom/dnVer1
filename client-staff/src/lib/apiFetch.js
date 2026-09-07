// export async function apiFetch(path, opts = {}) {
//   const token = localStorage.getItem('aladdin_token');
//   const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
//   const headers = {
//     ...(opts.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...opts.headers
//   };

//   const res = await fetch(path, { ...opts, headers });

//   if (res.status === 401) {
//     localStorage.removeItem('aladdin_token');
//     localStorage.removeItem('aladdin_staff');
//     window.location.reload();
//   }

//   return res;
// }

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('aladdin_token');
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers = {
    ...(opts.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers
  };

  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(fullUrl, { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_staff'); // Đã đổi sang key chuẩn của Staff
    window.location.reload();
  }

  return res;
}