'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/auth-provider';

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}! 👋</h1>
        <p className="mt-1 text-gray-600">
          Your AI-powered career acceleration dashboard
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Applications This Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Applications This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">No data yet</p>
          </CardContent>
        </Card>

        {/* Active Searches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">No data yet</p>
          </CardContent>
        </Card>

        {/* Resume Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Best Resume Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              0
              <span className="text-lg">/100</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">No data yet</p>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              0%
            </div>
            <p className="text-xs text-gray-500 mt-1">No data yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/jobs">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">🔍 Find Jobs</CardTitle>
              <CardDescription>Search and discover job opportunities</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/resume">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">📄 Resume Builder</CardTitle>
              <CardDescription>Create and optimize your resumes</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/apply">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">📋 Applications</CardTitle>
              <CardDescription>Track and manage applications</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Welcome Message */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>🎯 Getting Started</CardTitle>
          <CardDescription>Start your career acceleration journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Welcome to Digital FTE! Use the sidebar to navigate between different features:
          </p>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li><strong>Job Search:</strong> Find jobs matching your profile</li>
            <li><strong>Resume:</strong> Build and optimize your resumes with AI</li>
            <li><strong>Applications:</strong> Review and manage job applications</li>
            <li><strong>Settings:</strong> Customize your preferences</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
