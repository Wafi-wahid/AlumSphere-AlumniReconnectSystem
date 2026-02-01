const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function api<T = any>(path: string, options: RequestInit = {}, retries = 2, timeoutMs = 15000): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
        signal: controller.signal,
      });
      clearTimeout(t);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : (await res.text());
      if (!res.ok) {
        const message = (isJson && (data as any)?.error) || res.statusText || 'Request failed';
        throw new Error(message);
      }
      return data as T;
    } catch (e: any) {
      clearTimeout(t);
      lastErr = e;
      const msg = String(e?.message || e);
      // Retry on network errors/aborts
      const retriable = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('aborted') || msg.includes('network') || msg.includes('TIMED') || msg.includes('reset');
      if (attempt < retries && retriable) {
        const backoff = 300 * Math.pow(2, attempt);
        await sleep(backoff);
        attempt++;
        continue;
      }
      // Surface clearer error
      throw new Error(`API error (${url}): ${msg}`);
    }
  }
  throw lastErr || new Error('Unknown API error');
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
