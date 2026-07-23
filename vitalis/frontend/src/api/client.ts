const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('vitalis_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('vitalis_token', token);
  else localStorage.removeItem('vitalis_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path: string, body?: unknown) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  delete: (path: string) => request(path, { method: 'DELETE' })
};

export { API_URL };
