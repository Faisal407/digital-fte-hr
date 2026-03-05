'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function InterviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Interview Prep 🎯</h1>
        <p className="mt-2 text-gray-600">
          Practice interviews with AI coaching and get company-specific preparation
        </p>
      </div>

      {/* Featured Section */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-8">
        <div className="flex items-start gap-4">
          <span className="text-5xl">🤖</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">AI Interview Coach</h2>
            <p className="mt-2 text-gray-700">
              Practice mock interviews with our AI coach. Get real-time feedback on your answers, body language, and confidence.
            </p>
            <Button className="mt-4 bg-primary-400 hover:bg-primary-500 text-white">
              Start Mock Interview →
            </Button>
          </div>
        </div>
      </div>

      {/* Practice Modes */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Practice Modes</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: 'Behavioral Questions', emoji: '💭', desc: 'STAR method practice' },
            { title: 'Technical Questions', emoji: '⚙️', desc: 'Role-specific skills' },
            { title: 'Company-Specific', emoji: '🏢', desc: 'About your target company' },
          ].map((mode) => (
            <div
              key={mode.title}
              className="rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-primary-400 transition-all"
            >
              <div className="text-3xl mb-3">{mode.emoji}</div>
              <h3 className="font-bold text-gray-900">{mode.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{mode.desc}</p>
              <Button
                variant="outline"
                className="w-full mt-3 border-primary-400 text-primary-400 hover:bg-primary-50"
              >
                Practice
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Interviews Practiced" value="0" icon="📹" />
        <DashboardCard title="Avg Confidence" value="0%" icon="💪" />
        <DashboardCard title="Improvement" value="0%" icon="📈" variant="success" />
      </div>

      {/* Resources */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Interview Resources</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">📚</span>
            <span className="text-gray-700"><strong>STAR Method Guide</strong> - Learn the Situation, Task, Action, Result framework</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">🎯</span>
            <span className="text-gray-700"><strong>Company Research</strong> - Deep dive into your target companies</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">💬</span>
            <span className="text-gray-700"><strong>Negotiation Tips</strong> - Master salary and benefits discussions</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary-400 font-bold">✅</span>
            <span className="text-gray-700"><strong>Questions to Ask</strong> - Smart questions to ask the interviewer</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
