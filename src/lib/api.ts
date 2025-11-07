const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : (await res.text());
  if (!res.ok) {
    const message = (isJson && (data as any)?.error) || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const AuthAPI = {
  me: () => api<{ user: any }>("/auth/me"),
  login: (payload: { email: string; password: string }) => api<{ user: any }>("/auth/login", { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => api<{ ok: boolean }>("/auth/logout", { method: 'POST' }),
  register: (payload: any) => api<{ user: any }>("/auth/register", { method: 'POST', body: JSON.stringify(payload) }),
};

export const UsersAPI = {
  me: () => api<{ user: any }>("/me"),
  updateMe: (payload: any) => api<{ user: any }>("/me", { method: 'PATCH', body: JSON.stringify(payload) }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => api<{ ok: boolean }>("/me/password", { method: 'PATCH', body: JSON.stringify(payload) }),
  changeEmail: (payload: { newEmail: string; password: string }) => api<{ ok: boolean; email: string }>("/me/email", { method: 'PATCH', body: JSON.stringify(payload) }),
};
