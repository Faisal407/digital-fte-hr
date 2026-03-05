'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useResumes } from '@/hooks/useApi';
import { getATSScoreColor } from '@/lib/utils';

export default function ResumePage() {
  const { data: resumes, isLoading, error, refetch } = useResumes();

  const getScoreColor = (score?: number): 'default' | 'error' | 'warning' | 'success' => {
    if (!score) return 'default';
    const color = getATSScoreColor(score);
    const colorMap: Record<string, 'default' | 'error' | 'warning' | 'success'> = {
      red: 'error',
      yellow: 'warning',
      green: 'success',
    };
    return colorMap[color] || 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Resumes</h1>
        <p className="text-gray-600">Loading your resumes...</p>
        <div className="space-y-3">
          {Array(2)
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
        <h1 className="text-3xl font-bold text-gray-900">Resumes</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-red-900">Unable to load resumes</h3>
              <p className="mt-1 text-sm text-red-800">
                There was a problem loading your resumes. Please try again.
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

  const resumeList = Array.isArray(resumes) ? resumes : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumes</h1>
          <p className="mt-1 text-gray-600">Manage and optimize your resumes with ATS scoring</p>
        </div>
        <Link href="/dashboard/resume/new" className="w-full sm:w-auto">
          <Button className="w-full">➕ New Resume</Button>
        </Link>
      </div>

      {resumeList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">📄 No resumes yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Create your first resume to get started
              </p>
              <Link href="/dashboard/resume/new" className="mt-4 inline-block w-full sm:w-auto">
                <Button className="w-full">Create Your First Resume</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {resumeList.map((resume: any) => (
            <Card key={resume.id} className={resume.isActive ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Resume v{resume.versionNumber}</CardTitle>
                    <CardDescription>
                      {resume.sourceType === 'upload' && '📄 Uploaded'}
                      {resume.sourceType === 'form' && '✏️ Created'}
                      {resume.sourceType === 'linkedin' && '💼 LinkedIn'}
                      {resume.sourceType === 'voice' && '🎤 Voice'}
                    </CardDescription>
                  </div>
                  {resume.isActive && <Badge>Active</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.atsScore && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">ATS Score</span>
                      <span className="text-lg font-bold">{resume.atsScore}/100</span>
                    </div>
                    <Progress
                      value={resume.atsScore}
                      color={getScoreColor(resume.atsScore)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/dashboard/resume/${resume.id}`} className="flex-1">
                    <Button variant="default" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/resume/${resume.id}/score`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Score
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resume Tips */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">ATS Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Use standard fonts and formatting</li>
            <li>✓ Include relevant keywords from job descriptions</li>
            <li>✓ Avoid tables, images, and graphics</li>
            <li>✓ Use proper section headings</li>
            <li>✓ Quantify achievements with metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
