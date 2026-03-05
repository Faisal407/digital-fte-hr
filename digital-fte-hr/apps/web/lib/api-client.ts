/**
 * Typed API Client
 * Handles all communication with backend REST API
 * Automatically injects authentication headers
 */

import { ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase-client';

export type { ApiResponse };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<T = unknown> {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: T;
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (_error) {
      // Session not available (e.g., static page)
    }

    return headers;
  }

  async request<T, R = unknown>(
    endpoint: string,
    options: RequestOptions<T> = {},
  ): Promise<ApiResponse<R>> {
    const { method = 'GET', headers = {}, body, params } = options;

    const url = this.buildUrl(endpoint, params);
    const authHeaders = await this.getAuthHeaders();

    const requestInit: RequestInit = {
      method,
      headers: {
        ...authHeaders,
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || {
            code: `HTTP_${response.status}`,
            message: response.statusText,
          },
        };
      }

      const data = await response.json();
      return data as ApiResponse<R>;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  async get<R = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions<never>, 'body' | 'method'>,
  ): Promise<ApiResponse<R>> {
    return this.request<never, R>(endpoint, { ...options, method: 'GET' });
  }

  async post<T, R = unknown>(
    endpoint: string,
    body?: T,
    options?: Omit<RequestOptions<T>, 'body' | 'method'>,
  ): Promise<ApiResponse<R>> {
    return this.request<T, R>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T, R = unknown>(
    endpoint: string,
    body?: T,
    options?: Omit<RequestOptions<T>, 'body' | 'method'>,
  ): Promise<ApiResponse<R>> {
    return this.request<T, R>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T, R = unknown>(
    endpoint: string,
    body?: T,
    options?: Omit<RequestOptions<T>, 'body' | 'method'>,
  ): Promise<ApiResponse<R>> {
    return this.request<T, R>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<R = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions<never>, 'body' | 'method'>,
  ): Promise<ApiResponse<R>> {
    return this.request<never, R>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// Typed API endpoints
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    signup: (email: string, password: string, firstName: string, lastName: string) =>
      apiClient.post('/auth/signup', { email, password, firstName, lastName }),
    refresh: () => apiClient.post('/auth/refresh', {}),
  },

  // Jobs
  jobs: {
    search: (body: Record<string, unknown>) => apiClient.post('/jobs/search', body),
    getDetail: (jobId: string) => apiClient.get(`/jobs/${jobId}`),
    getSearchStatus: (searchId: string) => apiClient.get(`/jobs/search/${searchId}`),
  },

  // Resumes
  resumes: {
    list: () => apiClient.get('/resumes'),
    create: (body: FormData) =>
      apiClient.post('/resumes', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    getDetail: (resumeId: string) => apiClient.get(`/resumes/${resumeId}`),
    getScore: (resumeId: string) => apiClient.get(`/resumes/${resumeId}/score`),
    optimize: (resumeId: string) => apiClient.post(`/resumes/${resumeId}/optimize`, {}),
    tailor: (resumeId: string, jobId: string) =>
      apiClient.post(`/resumes/${resumeId}/tailor`, { jobId }),
  },

  // Applications
  applications: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/applications', { params: params as Record<string, string | number | boolean> }),
    queue: (body: Record<string, unknown>) => apiClient.post('/applications/queue', body),
    approve: (appId: string, body?: Record<string, unknown>) =>
      apiClient.patch(`/applications/${appId}/approve`, body),
    skip: (appId: string, reason: string) =>
      apiClient.patch(`/applications/${appId}/skip`, { reason }),
    getDetail: (appId: string) => apiClient.get(`/applications/${appId}`),
  },

  // Dashboard
  dashboard: {
    overview: () => apiClient.get('/dashboard/overview'),
    weekly: () => apiClient.get('/dashboard/weekly'),
    monthly: () => apiClient.get('/dashboard/monthly'),
    platforms: () => apiClient.get('/dashboard/platforms'),
  },

  // Channels
  channels: {
    getPreferences: () => apiClient.get('/channels/preferences'),
    updatePreferences: (body: Record<string, unknown>) =>
      apiClient.patch('/channels/preferences', body),
  },

  // Tasks
  tasks: {
    getStatus: (taskId: string) => apiClient.get(`/tasks/${taskId}`),
  },

  // Plans
  plans: {
    list: () => apiClient.get('/plans'),
    upgrade: () => apiClient.post('/plans/upgrade', {}),
  },

  // Account
  account: {
    delete: () => apiClient.post('/account/delete', {}),
    export: () => apiClient.get('/account/export'),
  },
};
