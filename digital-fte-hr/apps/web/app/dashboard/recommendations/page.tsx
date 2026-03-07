'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function RecommendationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Poll for results when taskId is set
  useEffect(() => {
    if (!taskId) return;

    const pollResults = async () => {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      const response = await fetch(`/api/v1/jobs/search/${taskId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data?.jobs) {
        setJobs(data.data.jobs);
        setIsSearching(false);
      }
    };

    const interval = setInterval(pollResults, 1500);
    return () => clearInterval(interval);
  }, [taskId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setJobs([]);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    const response = await fetch('/api/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query: searchQuery }),
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
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 transition-colors">
            Remote
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 transition-colors">
            Full-time
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 transition-colors">
            Last 7 days
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:border-primary-400 transition-colors">
            $100k+
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
                <Button size="sm" className="mt-3 w-full bg-primary-400 hover:bg-primary-500">
                  View & Apply
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
          value="0"
          icon="✅"
        />
        <DashboardCard
          title="Avg Match Score"
          value="0%"
          icon="⭐"
        />
      </div>
    </div>
  );
}
