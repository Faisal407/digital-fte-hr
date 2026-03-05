'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function RecommendationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // TODO: Integrate with job search API
    setTimeout(() => setIsSearching(false), 1000);
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
        <div className="text-center py-12">
          <p className="text-gray-600">
            👇 Start a search to see job recommendations
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Our AI will analyze your profile and find the best matches for you
          </p>
        </div>
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
