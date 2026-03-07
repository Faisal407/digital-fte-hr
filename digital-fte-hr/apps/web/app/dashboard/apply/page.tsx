'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationsPage() {
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch applications from API
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications', refreshCount],
    queryFn: async () => {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;
      const res = await fetch('/api/v1/applications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });

  const applications = applicationsData?.data?.applications || [];
  const stats = applicationsData?.data?.stats || {};

  const handleSkipApplication = async (appId: string) => {
    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const res = await fetch(`/api/v1/applications/${appId}/skip`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'user_skipped' }),
      });
      if (res.ok) {
        alert('✅ Application skipped');
        setRefreshCount(c => c + 1);
      }
    } catch (err) {
      alert('❌ Error skipping application');
    }
  };

  const handleApproveApplication = async (appId: string) => {
    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const res = await fetch(`/api/v1/applications/${appId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        alert('✅ Application approved and submitted');
        setRefreshCount(c => c + 1);
      }
    } catch (err) {
      alert('❌ Error approving application');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Application Tracker ✅</h1>
        <p className="mt-2 text-gray-600">
          Review, approve, and track all your job applications
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && applications.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-900">No applications yet</h3>
          <p className="mt-2 text-gray-600 mb-6">
            Start by searching for jobs and applying to opportunities
          </p>
          <Link href="/dashboard/recommendations">
            <Button className="bg-primary-400 hover:bg-primary-500 text-white">
              Search for Jobs →
            </Button>
          </Link>
        </div>
      )}

      {/* Applications List */}
      {!isLoading && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const statusColors: Record<string, string> = {
              pending_review: 'bg-yellow-100 text-yellow-800',
              submitted: 'bg-blue-100 text-blue-800',
              viewed: 'bg-purple-100 text-purple-800',
              shortlisted: 'bg-green-100 text-green-800',
              rejected: 'bg-red-100 text-red-800',
              skipped: 'bg-gray-100 text-gray-800',
            };
            const statusColor = statusColors[app.status] || 'bg-gray-100 text-gray-800';
            const statusLabel = app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ');

            return (
              <div key={app.id} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{app.jobTitle}</h3>
                    <p className="text-gray-600">{app.company}</p>
                  </div>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold">{app.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Match Score</p>
                    <p className="font-semibold text-primary-400">{app.matchScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Platform</p>
                    <p className="font-semibold capitalize">{app.platform}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Applied</p>
                    <p className="font-semibold">{new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {app.status === 'pending_review' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveApplication(app.id)} className="bg-green-600 hover:bg-green-700">
                      Approve & Submit
                    </Button>
                    <Button size="sm" onClick={() => handleSkipApplication(app.id)} variant="outline">
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Applied" value={stats.totalApplications?.toString() || '0'} icon="✅" />
        <DashboardCard title="In Review" value={stats.pending_review?.toString() || '0'} icon="⏳" />
        <DashboardCard title="Shortlisted" value={stats.shortlisted?.toString() || '0'} icon="⭐" />
        <DashboardCard
          title="Submitted"
          value={stats.submitted?.toString() || '0'}
          icon="📧"
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Applications</h3>
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending Review', 'Submitted', 'Viewed', 'Shortlisted', 'Rejected'].map((status) => (
            <button
              key={status}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-gray-200 bg-primary-50 p-6">
        <h3 className="text-lg font-bold text-gray-900">Application Management Tips</h3>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>✓ Review applications before they are submitted</li>
          <li>✓ Keep track of your application progress</li>
          <li>✓ Follow up on opportunities after 2 weeks</li>
          <li>✓ Customize cover letters for each application</li>
        </ul>
      </div>
    </div>
  );
}
