import { api } from './api';

export const RecommendationsAPI = {
  mentors: (fallback?: boolean) => api<{ mentors: any[] }>(`/recommendations/mentors${fallback ? '?fallback=true' : ''}`),
  jobs: (fallback?: boolean) => api<{ jobs: any[] }>(`/recommendations/jobs${fallback ? '?fallback=true' : ''}`),
  events: (fallback?: boolean) => api<{ events: any[] }>(`/recommendations/events${fallback ? '?fallback=true' : ''}`),
};
