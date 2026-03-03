'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplications } from '@/hooks/useApi';
import { STATUS_COLORS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function ApplicationsPage() {
  const { data: applications, isLoading, error, refetch } = useApplications({
    status: 'pending_review',
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Applications Review Queue</h1>
        <p className="mt-1 text-gray-600">Loading your pending applications...</p>
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full" />
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Applications Review Queue</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-red-900">Unable to load applications</h3>
              <p className="mt-1 text-sm text-red-800">
                There was a problem loading your pending applications. Please try again.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="default"
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const apps = Array.isArray(applications) ? applications : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications Review Queue</h1>
        <p className="mt-1 text-gray-600">
          Review and approve applications before they are submitted
        </p>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">✨ No pending applications</p>
              <p className="mt-1 text-sm text-gray-500">
                Ready to find your next opportunity?
              </p>
              <Link href="/dashboard/jobs">
                <Button className="mt-4">Search for Jobs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((app: any) => (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                    <CardDescription>{app.company}</CardDescription>
                  </div>
                  <Badge variant={app.status === 'pending_review' ? 'warning' : 'default'}>
                    {STATUS_COLORS[app.status as keyof typeof STATUS_COLORS]?.label ||
                      app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{app.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Match Score</p>
                    <p className="text-sm font-medium text-blue-600">{app.matchScore}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salary</p>
                    <p className="text-sm font-medium">{app.salary || 'Not disclosed'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Posted</p>
                    <p className="text-sm font-medium">{formatDate(app.postedAt, 'short')}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/apply/${app.id}`} className="flex-1">
                    <Button className="w-full" variant="default">
                      Review & Approve
                    </Button>
                  </Link>
                  <Link href={`/dashboard/apply/${app.id}`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
