'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardOverview } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: overview, isLoading, error, refetch } = useDashboardOverview();

  const handleRetry = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-red-900">Unable to load dashboard</h3>
              <p className="mt-1 text-sm text-red-800">
                There was a problem loading your dashboard data. Please try again.
              </p>
            </div>
            <Button
              onClick={handleRetry}
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

  const dashboardData = overview as any;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Welcome back! Here's your AI career acceleration overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Applications This Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Applications This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold">
                {dashboardData?.applicationsThisWeek || 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Searches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold">
                {dashboardData?.activeSearches || 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resume Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Best Resume Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {dashboardData?.bestResumeScore || 0}
                <span className="text-lg">/100</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">
                {dashboardData?.responseRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your next step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/dashboard/jobs">
              <Button variant="default" className="w-full">
                🔍 Search Jobs
              </Button>
            </Link>
            <Link href="/dashboard/resume">
              <Button variant="outline" className="w-full">
                📄 Upload Resume
              </Button>
            </Link>
            <Link href="/dashboard/apply">
              <Button variant="outline" className="w-full">
                ✉️ Review Applications
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest actions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp}
                    </p>
                  </div>
                  <span className="text-lg">{activity.icon}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500">
                No recent activity yet. Start by searching for jobs!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
