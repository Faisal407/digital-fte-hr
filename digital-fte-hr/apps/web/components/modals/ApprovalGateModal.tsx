'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ApprovalGateModalProps {
  isOpen: boolean;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    description: string;
    matchScore: number;
  };
  onApprove: (edits?: any) => void;
  onSkip: () => void;
  isSubmitting?: boolean;
}

export function ApprovalGateModal({
  isOpen,
  job,
  onApprove,
  onSkip,
  isSubmitting = false,
}: ApprovalGateModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [activeTab, setActiveTab] = useState<'review' | 'cover-letter'>('review');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Review & Approve Application</h2>
          <p className="mt-1 text-sm text-gray-600">Before we submit, please review the job details</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'review'
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Job Review
            </button>
            <button
              onClick={() => setActiveTab('cover-letter')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'cover-letter'
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cover Letter
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {activeTab === 'review' && (
            <div className="space-y-6">
              {/* Job Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                <p className="text-gray-600">{job.company}</p>
              </div>

              {/* Match Score */}
              <div className="rounded-lg bg-primary-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Match Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-400">{job.matchScore}%</span>
                    <span className="text-sm text-gray-600">excellent match</span>
                  </div>
                </div>
              </div>

              {/* Job Info Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Location</p>
                  <p className="mt-1 font-semibold text-gray-900">{job.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Salary</p>
                  <p className="mt-1 font-semibold text-gray-900">{job.salary || 'Not disclosed'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Type</p>
                  <p className="mt-1 font-semibold text-gray-900">Full-time</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Posted</p>
                  <p className="mt-1 font-semibold text-gray-900">2 days ago</p>
                </div>
              </div>

              {/* Description Preview */}
              <div>
                <h4 className="font-semibold text-gray-900">Job Description</h4>
                <p className="mt-2 line-clamp-3 text-sm text-gray-700">{job.description}</p>
              </div>

              {/* Warning */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-900">
                  ⚠️ <strong>Ready to apply?</strong> Once approved, we'll submit your application immediately.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cover-letter' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                <textarea
                  id="cover-letter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Add a personalized cover letter... or we'll use your default."
                  className="mt-2 h-48 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {coverLetter.length} / 1000 characters
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Tip:</strong> Personalized cover letters increase response rates by 30%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            Skip This Job
          </Button>
          <Button
            onClick={() => onApprove({ coverLetter: coverLetter || undefined })}
            disabled={isSubmitting}
            className="bg-primary-400 hover:bg-primary-500 text-white"
          >
            {isSubmitting ? '⏳ Submitting...' : '✅ Approve & Apply'}
          </Button>
        </div>
      </div>
    </div>
  );
}
