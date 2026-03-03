/**
 * API Hooks using TanStack Query
 * Provides typed queries and mutations for API calls
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api-client';
import { useToast } from '@/store/ui-store';

/**
 * Generic hook for GET requests
 */
export function useApiQuery<T>(
  key: (string | unknown)[],
  queryFn: () => Promise<ApiResponse<T>>,
  options?: {
    enabled?: boolean;
    retry?: boolean | number;
    staleTime?: number;
  },
) {
  const { error: showError } = useToast();

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await queryFn();
      if (!response.success) {
        showError('Error', response.error?.message || 'Request failed');
        throw new Error(response.error?.message || 'Request failed');
      }
      return response.data;
    },
    enabled: options?.enabled !== false,
    retry: options?.retry ?? 1,
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Generic hook for mutations
 */
export function useApiMutation<TData, TError = unknown>(
  mutationFn: (data: TData) => Promise<ApiResponse<unknown>>,
  options?: {
    onSuccess?: (data: unknown) => void;
    onError?: (error: TError) => void;
  },
) {
  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      if (response.success) {
        showSuccess('Success', 'Operation completed');
        queryClient.invalidateQueries();
        options?.onSuccess?.(response.data);
      } else {
        showError('Error', response.error?.message || 'Operation failed');
      }
    },
    onError: (error: any) => {
      showError('Error', error?.message || 'An error occurred');
      options?.onError?.(error);
    },
  });
}

/**
 * Job API Hooks
 */
export function useJobSearch() {
  return useApiMutation(
    (params: Record<string, unknown>) => api.jobs.search(params),
    {
      onSuccess: () => {
        // Handle success
      },
    },
  );
}

export function useJobDetail(jobId: string) {
  return useApiQuery(['job', jobId], () => api.jobs.getDetail(jobId), {
    enabled: !!jobId,
  });
}

/**
 * Resume API Hooks
 */
export function useResumes() {
  return useApiQuery(['resumes'], () => api.resumes.list());
}

export function useResumeDetail(resumeId: string) {
  return useApiQuery(['resume', resumeId], () => api.resumes.getDetail(resumeId), {
    enabled: !!resumeId,
  });
}

export function useResumeScore(resumeId: string) {
  return useApiQuery(['resume-score', resumeId], () => api.resumes.getScore(resumeId), {
    enabled: !!resumeId,
  });
}

export function useOptimizeResume() {
  return useApiMutation(
    (resumeId: string) => api.resumes.optimize(resumeId),
    {
      onSuccess: () => {
        // Resume optimization started
      },
    },
  );
}

export function useTailorResume() {
  return useApiMutation(
    ({ resumeId, jobId }: { resumeId: string; jobId: string }) =>
      api.resumes.tailor(resumeId, jobId),
  );
}

/**
 * Application API Hooks
 */
export function useApplications(filters?: Record<string, unknown>) {
  return useApiQuery(['applications', filters], () => api.applications.list(filters));
}

export function useApplicationDetail(appId: string) {
  return useApiQuery(['application', appId], () => api.applications.getDetail(appId), {
    enabled: !!appId,
  });
}

export function useQueueApplication() {
  return useApiMutation((body: Record<string, unknown>) => api.applications.queue(body));
}

export function useApproveApplication() {
  return useApiMutation(({ appId, body }: { appId: string; body?: Record<string, unknown> }) =>
    api.applications.approve(appId, body),
  );
}

export function useSkipApplication() {
  return useApiMutation(({ appId, reason }: { appId: string; reason: string }) =>
    api.applications.skip(appId, reason),
  );
}

/**
 * Dashboard API Hooks
 */
export function useDashboardOverview() {
  return useApiQuery(['dashboard-overview'], () => api.dashboard.overview());
}

export function useDashboardWeekly() {
  return useApiQuery(['dashboard-weekly'], () => api.dashboard.weekly(), {
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useDashboardMonthly() {
  return useApiQuery(['dashboard-monthly'], () => api.dashboard.monthly(), {
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useDashboardPlatforms() {
  return useApiQuery(['dashboard-platforms'], () => api.dashboard.platforms(), {
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Task Status Hook
 */
export function useTaskStatus(taskId: string) {
  return useApiQuery(['task', taskId], () => api.tasks.getStatus(taskId), {
    enabled: !!taskId,
    staleTime: 1000 * 10, // 10 seconds (short stale time for polling)
  });
}

/**
 * Channel Preferences Hooks
 */
export function useChannelPreferences() {
  return useApiQuery(['channel-preferences'], () => api.channels.getPreferences());
}

export function useUpdateChannelPreferences() {
  return useApiMutation((body: Record<string, unknown>) => api.channels.updatePreferences(body));
}

/**
 * Plan Hooks
 */
export function usePlans() {
  return useApiQuery(['plans'], () => api.plans.list());
}

export function useUpgradePlan() {
  return useApiMutation(() => api.plans.upgrade());
}
