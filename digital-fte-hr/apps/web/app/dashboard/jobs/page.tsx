'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function JobSearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // TODO: Implement job search API integration
    setTimeout(() => setIsSearching(false), 1000);
  };

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
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
              {isSearching ? 'Searching...' : 'Search Jobs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>Job matches from 15+ platforms</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {isSearching ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Searching jobs...</p>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6 mx-auto"></div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              {query
                ? 'Searching for jobs... This is a placeholder for Phase 2 implementation.'
                : 'Enter a job title and location to get started'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Popular Searches */}
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
                className="cursor-pointer"
                onClick={() => setQuery(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
