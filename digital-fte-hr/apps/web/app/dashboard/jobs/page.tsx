'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { JobMatchCard } from '@/components/jobs/JobMatchCard';

export default function JobSearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);

  // Mutation to start job search
  const searchMutation = useMutation({
    mutationFn: async () => {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      const response = await fetch('/api/v1/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, location }),
      });

      const data = await response.json();
      if (data.success && data.data && 'taskId' in data.data) {
        return data.data.taskId;
      }
      throw new Error('Search failed');
    },
    onSuccess: (newTaskId) => {
      setTaskId(newTaskId);
    },
  });

  // Query to poll search results
  const { data: searchResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ['jobSearch', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      const response = await fetch(`/api/v1/jobs/search/${taskId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      return response.json();
    },
    enabled: !!taskId,
    refetchInterval: 2000,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate();
  };

  const jobs = (searchResults?.data && typeof searchResults.data === 'object' && 'jobs' in searchResults.data)
    ? ((searchResults.data as { jobs: Array<Record<string, unknown>> }).jobs || [])
    : [];
  const isSearching = searchMutation.isPending || isLoadingResults;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
        <p className="mt-1 text-gray-600">
          Search across 15+ job platforms with AI-powered matching
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Find Your Next Opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="query">Job Title or Keywords</Label>
                <Input
                  id="query"
                  placeholder="e.g., Product Manager, Senior Engineer"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  disabled={isSearching}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSearching}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
              {isSearching ? 'Searching...' : 'Search Jobs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {taskId && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoadingResults ? 'Searching...' : `Found ${jobs.length} Job Matches`}
            </h2>
          </div>

          {isLoadingResults && !jobs.length ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <JobMatchCard
                  key={(job as any)?.id}
                  job={job as any}
                  onSave={(jobId) => console.log('Saved:', jobId)}
                  onApply={(jobId) => console.log('Apply:', jobId)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Popular Searches */}
      {!taskId && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                'Product Manager',
                'Senior Engineer',
                'Data Scientist',
                'UX Designer',
                'Marketing Manager',
              ].map((search) => (
                <Badge
                  key={search}
                  variant="outline"
                  className="cursor-pointer hover:bg-[#00F0A0] hover:text-black"
                  onClick={() => setQuery(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
