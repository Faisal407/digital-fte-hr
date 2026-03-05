'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Briefcase, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface JobMatchCardProps {
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo?: string;
    };
    location: string;
    isRemote?: boolean;
    salary?: {
      min: number;
      max: number;
      currency: string;
      period: string;
    };
    matchScore: number;
    platform: string;
    postedAt: string;
    isGhostJob?: boolean;
    skills?: string[];
    atsType?: string;
  };
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00F0A0'; // Mint green
  if (score >= 60) return '#FDB022'; // Yellow/amber
  return '#FF4757'; // Red
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50';
  if (score >= 60) return 'bg-yellow-50';
  return 'bg-red-50';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-yellow-700';
  return 'text-red-700';
}

export function JobMatchCard({ job, onSave, onApply }: JobMatchCardProps) {
  const scoreColor = getScoreColor(job.matchScore);
  const scoreBgColor = getScoreBgColor(job.matchScore);
  const scoreTextColor = getScoreTextColor(job.matchScore);

  const salaryDisplay = job.salary
    ? `${job.salary.currency} ${(job.salary.min / 1000).toFixed(0)}K - ${(job.salary.max / 1000).toFixed(0)}K / ${job.salary.period}`
    : 'Salary not disclosed';

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {/* Score Ring */}
        <div className="flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-full ${scoreBgColor} flex items-center justify-center`}
            style={{ borderLeft: `4px solid ${scoreColor}`, borderTop: `4px solid ${scoreColor}` }}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold ${scoreTextColor}`}>{job.matchScore}%</div>
              <div className="text-xs text-gray-600">Match</div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company.name}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {job.platform}
            </Badge>
          </div>

          {/* Ghost job warning */}
          {job.isGhostJob && (
            <div className="mb-3 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
              <AlertCircle className="w-4 h-4" />
              Possibly a ghost job - apply with caution
            </div>
          )}

          {/* Job Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              {job.location}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-4 h-4 text-gray-500" />
              {salaryDisplay}
            </div>
            {job.atsType && (
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-gray-500" />
                {job.atsType}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              Posted {job.postedAt}
            </div>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave?.(job.id)}
              className="text-gray-700"
            >
              Save
            </Button>
            <Button
              size="sm"
              className="bg-[#00F0A0] hover:bg-[#00D68A] text-black font-medium"
              onClick={() => onApply?.(job.id)}
            >
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
