const FUNCTIONS_BASE = (import.meta as any).env?.VITE_FUNCTIONS_URL || "";

async function request<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!FUNCTIONS_BASE) throw new Error("VITE_FUNCTIONS_URL not set");
  const res = await fetch(`${FUNCTIONS_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new Error((isJson && (data as any)?.error) || res.statusText || 'Request failed');
  return data as T;
}

export const MentorshipAPI = {
  listMentors: (params: { q?: string; topic?: string; batch?: string; ratingMin?: number; pageToken?: string } = {}) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set('q', params.q);
    if (params.topic) usp.set('topic', params.topic);
    if (params.batch) usp.set('batch', params.batch);
    if (typeof params.ratingMin === 'number') usp.set('ratingMin', String(params.ratingMin));
    if (params.pageToken) usp.set('pageToken', params.pageToken);
    const qs = usp.toString();
    return request<{ items: any[]; nextPageToken?: string }>(`/mentors${qs ? `?${qs}` : ''}`);
  },
  getMentor: (id: string) => request<{ mentor: any }>(`/mentors/${id}`),
  createRequest: (payload: {
    mentorId: string;
    topic: string;
    sessionType: string;
    preferredDateTime: string;
    notes?: string;
  }) => request<{ ok: boolean; id: string }>(`/mentorshipRequests`, { method: 'POST', body: JSON.stringify(payload) }),
  listMyRequests: (as: 'student'|'mentor' = 'student') => request<{ items: any[]; nextPage?: number }>(`/mentorshipRequests?as=${as}`),
  updateRequest: (id: string, status: 'Accepted'|'Declined'|'Cancelled') => request<{ ok: boolean }>(`/mentorshipRequests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
