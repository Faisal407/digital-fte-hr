'use client';

import { useQuery } from '@tanstack/react-query';
import { TrackerBoard } from '@/components/tracker/TrackerBoard';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function TrackerPage() {
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => apiClient.get('/applications'),
  });

  const applications = (applicationsData?.data && typeof applicationsData.data === 'object' && 'applications' in applicationsData.data)
    ? ((applicationsData.data as any).applications || [])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
        <p className="mt-1 text-gray-600">
          Track your application journey across all job platforms
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <TrackerBoard
          applications={applications}
          onMoveApplication={(appId, newStatus) => console.log('Move:', appId, newStatus)}
        />
      )}
    </div>
  );
}
