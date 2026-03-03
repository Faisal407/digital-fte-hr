'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplicationDetail, useApproveApplication, useSkipApplication } from '@/hooks/useApi';
import { useToast } from '@/store/ui-store';
import { formatDate, formatCurrency, getATSScoreColor } from '@/lib/utils';
import { APPROVAL_GATE_TIMEOUT_MS } from '@/lib/constants';

/**
 * APPLICATION APPROVAL GATE
 * CRITICAL REQUIREMENT: Must never be bypassed
 * User must explicitly approve before submission
 * 24-hour expiration countdown enforced
 */
export default function ApplicationApprovalPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { warning } = useToast();

  // Fetch application details
  const { data: application, isLoading, error } = useApplicationDetail(params.id);

  // Mutations
  const { mutate: approve, isPending: isApproving } = useApproveApplication();
  const { mutate: skip, isPending: isSkipping } = useSkipApplication();

  // Form state
  const [coverLetter, setCoverLetter] = useState((application as any)?.coverLetterText || '');
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Calculate time remaining until expiration
  const app = application as any;
  const createdAt = app?.createdAt ? new Date(app.createdAt) : null;
  const expiresAt = createdAt ? new Date(createdAt.getTime() + APPROVAL_GATE_TIMEOUT_MS) : null;
  const timeRemaining = expiresAt ? expiresAt.getTime() - Date.now() : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const isExpired = timeRemaining <= 0;

  const { success } = useToast();

  const handleApprove = () => {
    if (!hasConfirmed) {
      warning('Confirmation Required', 'Please confirm the application details');
      return;
    }

    approve(
      { appId: params.id, body: { coverLetterText: coverLetter } },
      {
        onSuccess: () => {
          success('Application Approved', 'Your application has been submitted successfully!');
          setTimeout(() => {
            router.push('/dashboard/apply?status=approved');
          }, 1500);
        },
        onError: () => {
          warning('Submission Failed', 'There was an error submitting your app. Please try again.');
        },
      },
    );
  };

  const handleSkip = () => {
    skip(
      { appId: params.id, reason: 'User skipped application' },
      {
        onSuccess: () => {
          success('Application Skipped', 'This application has been removed from your queue.');
          setTimeout(() => {
            router.push('/dashboard/apply');
          }, 1500);
        },
        onError: () => {
          warning('Error', 'There was a problem skipping this app.');
        },
      },
    );
  };

  if (error || isExpired) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
        <Alert variant="destructive">
          <AlertTitle>
            {isExpired ? 'Application Expired' : 'Error Loading Application'}
          </AlertTitle>
          <AlertDescription>
            {isExpired
              ? 'This application approval link has expired (24 hour timeout). Please queue a new app.'
              : 'Failed to load application details'}
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/apply">
          <Button variant="outline">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !application) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const atsColor = getATSScoreColor(app.resumeAtsScore || 0);
  const atsColorClass = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
  }[atsColor];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Application</h1>
        <p className="mt-1 text-gray-600">
          This application requires your approval before submission
        </p>
      </div>

      {/* CRITICAL WARNING BANNER */}
      <Alert variant="warning">
        <AlertTitle>⏰ Approval Required</AlertTitle>
        <AlertDescription>
          This application expires in {hoursRemaining} hour(s). Please review carefully and
          explicitly approve or skip before the deadline.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{app.jobTitle}</CardTitle>
              <CardDescription>{app.company}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{app.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employment Type</p>
                  <p className="font-medium">{app.jobType || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Salary</p>
                  <p className="font-medium">
                    {app.salary
                      ? formatCurrency(app.salary, app.salaryCurrency || 'USD')
                      : 'Not disclosed'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Posted</p>
                  <p className="font-medium">{formatDate(app.postedAt, 'short')}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900">Job Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 max-h-48 overflow-y-auto">
                  {app.description}
                </p>
              </div>

              <div>
                <a
                  href={app.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Original Job Posting →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Resume Information */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Being Used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{app.resumeName}</p>
                    <p className="text-sm text-gray-600">Version {app.resumeVersion}</p>
                  </div>
                  <div className={`text-3xl font-bold ${atsColorClass}`}>
                    {app.resumeAtsScore}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  {atsColor === 'green' && '✅ ATS Optimized'}
                  {atsColor === 'yellow' && '⚠️ ATS Good'}
                  {atsColor === 'red' && '❌ ATS Needs Improvement'}
                </p>
              </div>
              <Link
                href={`/dashboard/resume/${app.resumeId}/score`}
                className="text-sm text-blue-600 hover:underline"
              >
                View ATS Score Details →
              </Link>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>Optional but recommended for higher response rates</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="h-32 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a personalized cover letter (optional)"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Approval Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Match Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{app.matchScore}%</div>
              <p className="mt-2 text-xs text-gray-600">
                This job matches your profile and preferences
              </p>
            </CardContent>
          </Card>

          {/* Confirmation Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Before You Apply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={hasConfirmed}
                  onChange={(e) => setHasConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  I have reviewed the job details, salary, and location
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  disabled
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
                <span className="text-sm text-gray-700">
                  My resume ({app.resumeName}) is current
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  disabled
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
                <span className="text-sm text-gray-700">
                  I am interested in this position
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="space-y-2 pt-6">
              <Button
                onClick={handleApprove}
                disabled={!hasConfirmed || isApproving}
                className="w-full"
                variant="default"
              >
                {isApproving ? 'Submitting...' : '✅ Approve & Submit'}
              </Button>
              <Button
                onClick={handleSkip}
                disabled={isSkipping}
                className="w-full"
                variant="outline"
              >
                {isSkipping ? 'Skipping...' : '⏭️ Skip This Job'}
              </Button>
            </CardContent>
          </Card>

          {/* Time Warning */}
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <p className="text-xs font-semibold text-yellow-800">
              ⏰ {hoursRemaining}h {Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))}m
              remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
