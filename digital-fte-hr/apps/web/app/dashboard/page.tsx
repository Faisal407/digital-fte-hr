'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useAuth } from '@/app/providers/auth-provider';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome back, {firstName}! 👋</h1>
        <p className="mt-2 text-lg text-gray-600">
          Your AI-powered career acceleration hub
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Applications This Week"
          value="0"
          icon="✅"
          subtitle="No data yet"
        />

        <DashboardCard
          title="Active Job Searches"
          value="0"
          icon="⚡"
          subtitle="No data yet"
        />

        <DashboardCard
          title="Best Resume Score"
          value="0/100"
          icon="📄"
          subtitle="No data yet"
          variant="success"
        />

        <DashboardCard
          title="Response Rate"
          value="0%"
          icon="📈"
          subtitle="No data yet"
          variant="primary"
        />
      </div>

      {/* AI Copilot Section */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">✨</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">AI Job Copilot</h2>
            <p className="mt-1 text-gray-700">
              Let our AI agent find the best jobs for you. Get personalized recommendations based on your profile.
            </p>
            <Link href="/dashboard/recommendations">
              <Button className="mt-4 bg-primary-400 hover:bg-primary-500 text-white">
                Start Job Search →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/recommendations">
          <div className="group rounded-lg border border-gray-200 bg-white p-6 cursor-pointer hover:shadow-lg hover:border-primary-400 transition-all">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900">Job Recommendations</h3>
            <p className="mt-1 text-sm text-gray-600">AI-powered job matches</p>
            <div className="mt-3 text-primary-400 group-hover:text-primary-500 font-semibold text-sm">
              Explore →
            </div>
          </div>
        </Link>

        <Link href="/dashboard/resume">
          <div className="group rounded-lg border border-gray-200 bg-white p-6 cursor-pointer hover:shadow-lg hover:border-primary-400 transition-all">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-bold text-gray-900">Resume Optimizer</h3>
            <p className="mt-1 text-sm text-gray-600">ATS-optimized resumes</p>
            <div className="mt-3 text-primary-400 group-hover:text-primary-500 font-semibold text-sm">
              Build →
            </div>
          </div>
        </Link>

        <Link href="/dashboard/applications">
          <div className="group rounded-lg border border-gray-200 bg-white p-6 cursor-pointer hover:shadow-lg hover:border-primary-400 transition-all">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-bold text-gray-900">Application Tracker</h3>
            <p className="mt-1 text-sm text-gray-600">Track all your applications</p>
            <div className="mt-3 text-primary-400 group-hover:text-primary-500 font-semibold text-sm">
              View →
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Getting Started</h3>
        <p className="mt-2 text-gray-600">
          Welcome to Digital FTE! Here's how to get started:
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">1</span>
            <span className="text-gray-700">
              <strong>Upload your resume</strong> - Start by creating your first optimized resume
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">2</span>
            <span className="text-gray-700">
              <strong>Search for jobs</strong> - Use AI recommendations to find perfect matches
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">3</span>
            <span className="text-gray-700">
              <strong>Auto-apply</strong> - Let our agent apply with your approval
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">4</span>
            <span className="text-gray-700">
              <strong>Track results</strong> - Monitor your progress with real-time analytics
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
