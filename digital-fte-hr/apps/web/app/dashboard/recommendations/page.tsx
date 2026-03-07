'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function RecommendationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    remote: false,
    fullTime: false,
    last7Days: false,
    salary100k: false,
  });

  // Fetch applications count
  const { data: applicationsData } = useQuery({
    queryKey: ['recommendations-applications', refreshCount],
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
  const appliedCount = applications.length;
  const avgMatchScore = applications.length > 0
    ? Math.round(applications.reduce((sum: number, app: any) => sum + (app.matchScore || 0), 0) / applications.length)
    : 0;

  const handleApplyJob = async (jobId: string) => {
    setApplyingJobId(jobId);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      // First, create a job application
      const response = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          jobListingId: jobId,
          resumeProfileId: 'default', // Use default resume for now
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Application created successfully!');
        setApplyingJobId(null);
        // Refetch applications count
        setRefreshCount(c => c + 1);
      } else {
        alert('❌ Failed to apply: ' + (data.error?.message || 'Unknown error'));
        setApplyingJobId(null);
      }
    } catch (err) {
      alert('❌ Error applying to job');
      setApplyingJobId(null);
    }
  };

  // Poll for results when taskId is set
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const pollResults = async () => {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      try {
        const response = await fetch(`/api/v1/jobs/search/${taskId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await response.json();

        if (data.success && data.data?.jobs) {
          setJobs(data.data.jobs);
          setIsSearching(false);
          // Stop polling once results received
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    // Poll immediately first
    pollResults();

    // Then poll every 1.5 seconds as fallback (in case results not ready)
    intervalRef.current = setInterval(pollResults, 1500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [taskId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setJobs([]);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    // Build search query with filters
    let searchStr = searchQuery;
    if (filters.remote) searchStr += ' remote';
    if (filters.fullTime) searchStr += ' full-time';
    if (filters.last7Days) searchStr += ' last 7 days';
    if (filters.salary100k) searchStr += ' $100k+';

    const response = await fetch('/api/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: searchStr,
        filters: {
          isRemote: filters.remote,
          jobType: filters.fullTime ? 'full-time' : undefined,
          datePosted: filters.last7Days ? '7d' : undefined,
          salaryMin: filters.salary100k ? 100000 : undefined,
        }
      }),
    });

    const data = await response.json();
    if (data.success && data.data?.taskId) {
      setTaskId(data.data.taskId);
    } else {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Job Recommendations 💼</h1>
        <p className="mt-2 text-gray-600">
          AI-powered job matches based on your profile and preferences
        </p>
      </div>

      {/* Search Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="Search jobs: Senior Product Manager, Remote, Dubai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isSearching}
            className="bg-primary-400 hover:bg-primary-500 text-white"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilters(f => ({ ...f, remote: !f.remote }))}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              filters.remote
                ? 'bg-primary-400 text-white border-primary-400'
                : 'border border-gray-300 hover:border-primary-400'
            }`}
          >
            🌍 Remote
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, fullTime: !f.fullTime }))}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              filters.fullTime
                ? 'bg-primary-400 text-white border-primary-400'
                : 'border border-gray-300 hover:border-primary-400'
            }`}
          >
            💼 Full-time
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, last7Days: !f.last7Days }))}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              filters.last7Days
                ? 'bg-primary-400 text-white border-primary-400'
                : 'border border-gray-300 hover:border-primary-400'
            }`}
          >
            📅 Last 7 days
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, salary100k: !f.salary100k }))}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              filters.salary100k
                ? 'bg-primary-400 text-white border-primary-400'
                : 'border border-gray-300 hover:border-primary-400'
            }`}
          >
            💰 $100k+
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {isSearching && (
          <div className="text-center py-12">
            <p className="text-gray-600">Searching jobs...</p>
          </div>
        )}
        {!isSearching && jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              👇 Start a search to see job recommendations
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Our AI will analyze your profile and find the best matches for you
            </p>
          </div>
        )}
        {jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-bold text-lg">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.companyName}</p>
                <p className="text-sm text-gray-500">{job.location}</p>
                {job.salaryMin && (
                  <p className="text-sm font-semibold text-primary-400 mt-2">
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                  </p>
                )}
                <Button
                  size="sm"
                  className="mt-3 w-full bg-primary-400 hover:bg-primary-500"
                  onClick={() => handleApplyJob(job.id)}
                  disabled={applyingJobId === job.id}
                >
                  {applyingJobId === job.id ? 'Applying...' : 'View & Apply'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Saved Jobs"
          value="0"
          icon="❤️"
        />
        <DashboardCard
          title="Applied"
          value={appliedCount.toString()}
          icon="✅"
        />
        <DashboardCard
          title="Avg Match Score"
          value={`${avgMatchScore}%`}
          icon="⭐"
        />
      </div>
    </div>
  );
}
