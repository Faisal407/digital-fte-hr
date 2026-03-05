'use client';

export const dynamic = 'force-dynamic';

import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard 📊</h1>
        <p className="mt-2 text-gray-600">
          Track your job search progress and career metrics
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Time Period</h3>
            <p className="text-sm text-gray-600">Select a date range to view analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-primary-400 text-primary-400 hover:bg-primary-50">
              This Week
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              This Month
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              All Time
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DashboardCard
            title="Jobs Found"
            value="0"
            icon="🔍"
            subtitle="This period"
          />
          <DashboardCard
            title="Applications"
            value="0"
            icon="✅"
            subtitle="Total submitted"
          />
          <DashboardCard
            title="Response Rate"
            value="0%"
            icon="📧"
            subtitle="Average response"
          />
          <DashboardCard
            title="Avg Match Score"
            value="0%"
            icon="⭐"
            subtitle="Match quality"
            variant="success"
          />
        </div>
      </div>

      {/* Application Pipeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application Pipeline</h3>
        <div className="space-y-4">
          {[
            { stage: 'Applied', count: 0, color: 'bg-blue-100 text-blue-800' },
            { stage: 'In Review', count: 0, color: 'bg-yellow-100 text-yellow-800' },
            { stage: 'Shortlisted', count: 0, color: 'bg-green-100 text-green-800' },
            { stage: 'Interview', count: 0, color: 'bg-purple-100 text-purple-800' },
            { stage: 'Offer', count: 0, color: 'bg-primary-100 text-primary-800' },
          ].map((stage) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-gray-900">{stage.stage}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded flex items-center">
                <div className={`h-full ${stage.color} rounded flex items-center justify-center text-sm font-bold`} style={{ width: '0%' }}>
                  {stage.count > 0 && stage.count}
                </div>
              </div>
              <span className="w-12 text-right text-sm font-medium text-gray-700">{stage.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-gray-200 bg-primary-50 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI Insights & Recommendations</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span className="text-gray-700">
              <strong>Start your first job search</strong> - Upload your resume to get AI-powered job recommendations
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">🎯</span>
            <span className="text-gray-700">
              <strong>Optimize your ATS score</strong> - Get recommendations to improve your resume for applicant tracking systems
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">⚡</span>
            <span className="text-gray-700">
              <strong>Speed up applications</strong> - Use auto-apply to submit applications 10x faster with human approval
            </span>
          </li>
        </ul>
      </div>

      {/* Weekly Report */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Weekly Report</h3>
          <Button variant="outline" className="border-primary-400 text-primary-400 hover:bg-primary-50">
            Download PDF
          </Button>
        </div>
        <p className="text-gray-600 text-center py-8">
          Your weekly report will appear here once you start applying
        </p>
      </div>
    </div>
  );
}
