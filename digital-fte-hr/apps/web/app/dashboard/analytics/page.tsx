'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock analytics data for different time periods
const ANALYTICS_DATA = {
  week: {
    jobsFound: 12,
    applications: 8,
    responseRate: 37.5,
    avgMatchScore: 78,
    pipeline: [
      { stage: 'Applied', count: 8 },
      { stage: 'In Review', count: 3 },
      { stage: 'Shortlisted', count: 1 },
      { stage: 'Interview', count: 0 },
      { stage: 'Offer', count: 0 },
    ],
    dailyChart: [
      { date: 'Mon', jobs: 2, applications: 1, responses: 0 },
      { date: 'Tue', jobs: 2, applications: 2, responses: 0 },
      { date: 'Wed', jobs: 3, applications: 2, responses: 1 },
      { date: 'Thu', jobs: 2, applications: 1, responses: 1 },
      { date: 'Fri', jobs: 2, applications: 2, responses: 1 },
      { date: 'Sat', jobs: 1, applications: 0, responses: 0 },
      { date: 'Sun', jobs: 0, applications: 0, responses: 0 },
    ],
  },
  month: {
    jobsFound: 47,
    applications: 32,
    responseRate: 28.1,
    avgMatchScore: 75,
    pipeline: [
      { stage: 'Applied', count: 32 },
      { stage: 'In Review', count: 12 },
      { stage: 'Shortlisted', count: 4 },
      { stage: 'Interview', count: 2 },
      { stage: 'Offer', count: 0 },
    ],
    dailyChart: [
      { date: 'Week 1', jobs: 12, applications: 8, responses: 2 },
      { date: 'Week 2', jobs: 11, applications: 9, responses: 2 },
      { date: 'Week 3', jobs: 15, applications: 10, responses: 3 },
      { date: 'Week 4', jobs: 9, applications: 5, responses: 2 },
    ],
  },
  allTime: {
    jobsFound: 127,
    applications: 89,
    responseRate: 22.5,
    avgMatchScore: 72,
    pipeline: [
      { stage: 'Applied', count: 89 },
      { stage: 'In Review', count: 28 },
      { stage: 'Shortlisted', count: 12 },
      { stage: 'Interview', count: 5 },
      { stage: 'Offer', count: 1 },
    ],
    dailyChart: [
      { date: 'Mar 1-7', jobs: 18, applications: 12, responses: 3 },
      { date: 'Mar 8-14', jobs: 22, applications: 15, responses: 4 },
      { date: 'Mar 15-21', jobs: 35, applications: 28, responses: 8 },
      { date: 'Mar 22-28', jobs: 30, applications: 22, responses: 6 },
      { date: 'Mar 29+', jobs: 22, applications: 12, responses: 3 },
    ],
  },
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'allTime'>('week');
  const data = ANALYTICS_DATA[period];

  const pipelineTotal = data.pipeline.reduce((sum, stage) => sum + stage.count, 0);

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
            <Button
              onClick={() => setPeriod('week')}
              variant={period === 'week' ? 'default' : 'outline'}
              className={period === 'week' ? 'bg-primary-400 hover:bg-primary-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            >
              This Week
            </Button>
            <Button
              onClick={() => setPeriod('month')}
              variant={period === 'month' ? 'default' : 'outline'}
              className={period === 'month' ? 'bg-primary-400 hover:bg-primary-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            >
              This Month
            </Button>
            <Button
              onClick={() => setPeriod('allTime')}
              variant={period === 'allTime' ? 'default' : 'outline'}
              className={period === 'allTime' ? 'bg-primary-400 hover:bg-primary-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
            >
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
            value={String(data.jobsFound)}
            icon="🔍"
            subtitle="This period"
          />
          <DashboardCard
            title="Applications"
            value={String(data.applications)}
            icon="✅"
            subtitle="Total submitted"
          />
          <DashboardCard
            title="Response Rate"
            value={data.responseRate.toFixed(1) + '%'}
            icon="📧"
            subtitle="Average response"
          />
          <DashboardCard
            title="Avg Match Score"
            value={data.avgMatchScore + '%'}
            icon="⭐"
            subtitle="Match quality"
            variant="success"
          />
        </div>
      </div>

      {/* Trend Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="jobs" stroke="#00F0A0" strokeWidth={2} name="Jobs Found" />
            <Line type="monotone" dataKey="applications" stroke="#8884d8" strokeWidth={2} name="Applications" />
            <Line type="monotone" dataKey="responses" stroke="#82ca9d" strokeWidth={2} name="Responses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Application Pipeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application Pipeline</h3>
        <div className="space-y-4">
          {data.pipeline.map((stage) => {
            const percentage = pipelineTotal > 0 ? (stage.count / pipelineTotal) * 100 : 0;
            const stageColors = {
              'Applied': 'bg-blue-100 text-blue-800',
              'In Review': 'bg-yellow-100 text-yellow-800',
              'Shortlisted': 'bg-green-100 text-green-800',
              'Interview': 'bg-purple-100 text-purple-800',
              'Offer': 'bg-primary-100 text-primary-800',
            };

            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-gray-900">{stage.stage}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded flex items-center">
                  {percentage > 0 && (
                    <div
                      className={`h-full ${stageColors[stage.stage as keyof typeof stageColors]} rounded flex items-center justify-center text-sm font-bold`}
                      style={{ width: `${percentage}%` }}
                    >
                      {stage.count}
                    </div>
                  )}
                </div>
                <span className="w-12 text-right text-sm font-medium text-gray-700">{stage.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Performance */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Platform Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={[
              { platform: 'LinkedIn', jobs: 35, applications: 28, responses: 7 },
              { platform: 'Indeed', jobs: 32, applications: 24, responses: 6 },
              { platform: 'Glassdoor', jobs: 28, applications: 20, responses: 4 },
              { platform: 'Other', jobs: 32, applications: 17, responses: 3 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="jobs" fill="#00F0A0" name="Jobs Found" />
            <Bar dataKey="applications" fill="#8884d8" name="Applications" />
            <Bar dataKey="responses" fill="#82ca9d" name="Responses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-gray-200 bg-primary-50 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI Insights & Recommendations</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-lg">💡</span>
            <span className="text-gray-700">
              <strong>Best performing platform:</strong> LinkedIn has the highest response rate at 20% - focus your efforts there
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">🎯</span>
            <span className="text-gray-700">
              <strong>Optimize your match score:</strong> Your average match score is {data.avgMatchScore}% - improve by updating your resume keywords
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-lg">⚡</span>
            <span className="text-gray-700">
              <strong>Application velocity:</strong> You're averaging {(data.applications / (period === 'week' ? 7 : period === 'month' ? 30 : 60)).toFixed(1)} applications per day - great momentum!
            </span>
          </li>
        </ul>
      </div>

      {/* Download Report */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Export Report</h3>
          <Button className="bg-primary-400 hover:bg-primary-500 text-white">
            📥 Download PDF
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Generate and download a comprehensive report of your job search analytics for {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'all time'}.
        </p>
      </div>
    </div>
  );
}
