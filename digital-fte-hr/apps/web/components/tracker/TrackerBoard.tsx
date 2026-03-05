'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  matchScore: number;
  appliedAt: string;
}

interface TrackerBoardProps {
  applications: Application[];
  onMoveApplication?: (appId: string, newStatus: string) => void;
}

const COLUMN_ORDER = ['pending_review', 'submitted', 'viewed', 'shortlisted', 'rejected'];
const COLUMN_LABELS: Record<string, string> = {
  pending_review: 'Applied',
  submitted: 'In Review',
  viewed: 'Viewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

const NEXT_STATUS: Record<string, string | null> = {
  pending_review: 'submitted',
  submitted: 'viewed',
  viewed: 'shortlisted',
  shortlisted: null,
  rejected: null,
};

export function TrackerBoard({ applications, onMoveApplication }: TrackerBoardProps) {
  const groupedByStatus = COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<string, Application[]>
  );

  const totalApplications = applications.length;
  const responseRate = totalApplications > 0
    ? Math.round((applications.filter((a) => a.status !== 'pending_review').length / totalApplications) * 100)
    : 0;
  const interviewsScheduled = applications.filter((a) => a.status === 'shortlisted').length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-2xl font-bold text-blue-900">{totalApplications}</div>
          <div className="text-sm text-blue-700">Total Applications</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-2xl font-bold text-green-900">{responseRate}%</div>
          <div className="text-sm text-green-700">Response Rate</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-2xl font-bold text-purple-900">{interviewsScheduled}</div>
          <div className="text-sm text-purple-700">Interviews Scheduled</div>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((status) => {
          const apps = groupedByStatus[status];
          const label = COLUMN_LABELS[status];

          return (
            <div
              key={status}
              className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{label}</h3>
                <Badge className="bg-[#00F0A0] text-black font-semibold">{apps.length}</Badge>
              </div>

              <div className="space-y-3">
                {apps.map((app) => (
                  <Card
                    key={app.id}
                    className="p-4 cursor-move hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{app.jobTitle}</h4>
                        <p className="text-xs text-gray-600">{app.company}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ml-2 ${
                          app.matchScore >= 80
                            ? 'bg-green-100 text-green-700'
                            : app.matchScore >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {app.matchScore}%
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">Applied {app.appliedAt}</p>

                    {/* Move button */}
                    {NEXT_STATUS[status] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-8 text-[#00F0A0] hover:bg-green-50"
                        onClick={() => onMoveApplication?.(app.id, NEXT_STATUS[status]!)}
                      >
                        Move Forward
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </Card>
                ))}

                {apps.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
