'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function ApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Application Tracker ✅</h1>
        <p className="mt-2 text-gray-600">
          Review, approve, and track all your job applications
        </p>
      </div>

      {/* Empty State */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Applied" value="0" icon="✅" />
        <DashboardCard title="In Review" value="0" icon="⏳" />
        <DashboardCard title="Shortlisted" value="0" icon="⭐" />
        <DashboardCard title="Response Rate" value="0%" icon="📊" />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Applications</h3>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            All
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            Pending Review
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            Submitted
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            Viewed
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            Shortlisted
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 hover:bg-primary-50 transition-colors">
            Rejected
          </button>
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
