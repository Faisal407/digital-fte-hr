'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ApprovalGateModal } from '@/components/modals/ApprovalGateModal';

const SAMPLE_JOB = {
  id: '1',
  title: 'Senior Product Manager',
  company: 'TechCorp Inc',
  location: 'San Francisco, CA',
  salary: '$150,000 - $180,000',
  description:
    'We are looking for an experienced Product Manager to lead our core product initiatives. You will work with design, engineering, and marketing teams to build world-class products.',
  matchScore: 92,
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApproveApplication = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setApplications([
        ...applications,
        {
          ...SAMPLE_JOB,
          status: 'submitted',
          submittedAt: new Date(),
        },
      ]);
      setShowApprovalModal(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleSkipApplication = () => {
    setShowApprovalModal(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Application Tracker ✅</h1>
        <p className="mt-2 text-gray-600">
          Review, approve, and track all your job applications
        </p>
      </div>

      {/* Demo Approval Button */}
      {applications.length === 0 && (
        <Button
          onClick={() => setShowApprovalModal(true)}
          className="bg-primary-400 hover:bg-primary-500 text-white"
        >
          Try Demo: View Job & Approve
        </Button>
      )}

      {/* Approval Modal */}
      <ApprovalGateModal
        isOpen={showApprovalModal}
        job={SAMPLE_JOB}
        onApprove={handleApproveApplication}
        onSkip={handleSkipApplication}
        isSubmitting={isSubmitting}
      />

      {/* Empty State */}
      {applications.length === 0 && (
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
      {applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{app.title}</h3>
                  <p className="text-gray-600">{app.company}</p>
                </div>
                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  ✓ Submitted
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-semibold">{app.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Match Score</p>
                  <p className="font-semibold text-primary-400">{app.matchScore}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Salary</p>
                  <p className="font-semibold">{app.salary}</p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-semibold">Just now</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Applied" value={applications.length} icon="✅" />
        <DashboardCard title="In Review" value="0" icon="⏳" />
        <DashboardCard title="Shortlisted" value="0" icon="⭐" />
        <DashboardCard title="Response Rate" value="0%" icon="📊" />
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
