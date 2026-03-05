'use client';
export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

export default function ResumePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Resume Optimizer 📄</h1>
        <p className="mt-2 text-gray-600">
          Create and optimize ATS-friendly resumes with AI assistance
        </p>
      </div>

      {/* No Resumes State */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="text-5xl mb-4">📤</div>
        <h3 className="text-lg font-bold text-gray-900">Upload Your Resume</h3>
        <p className="mt-2 text-gray-600 mb-6">
          Upload PDF, DOCX, or start from a template
        </p>
        <div className="flex flex-col gap-3 justify-center sm:flex-row">
          <Button className="bg-primary-400 hover:bg-primary-500 text-white">
            Choose File
          </Button>
          <Button variant="outline" className="border-primary-400 text-primary-400 hover:bg-primary-50">
            Use Template
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume Templates</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {['Modern', 'Classic', 'Creative'].map((template) => (
            <div
              key={template}
              className="rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-primary-400 transition-all"
            >
              <div className="aspect-video bg-gray-100 rounded mb-4 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold text-gray-900">{template}</h3>
              <p className="text-sm text-gray-600 mt-1">Professional template</p>
              <Button
                variant="outline"
                className="w-full mt-3 border-primary-400 text-primary-400 hover:bg-primary-50"
              >
                Use This
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Resumes Created" value="0" icon="📄" />
        <DashboardCard title="Avg ATS Score" value="0/100" icon="📊" variant="success" />
        <DashboardCard title="Optimized" value="0" icon="⚡" variant="primary" />
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-gray-200 bg-primary-50 p-6">
        <h3 className="text-lg font-bold text-gray-900">ATS Optimization Tips</h3>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>✓ Use standard fonts and formatting (Arial, Calibri, Times New Roman)</li>
          <li>✓ Include relevant keywords from job descriptions</li>
          <li>✓ Avoid tables, images, and graphics</li>
          <li>✓ Use proper section headings (Experience, Education, Skills)</li>
          <li>✓ Quantify achievements with metrics and numbers</li>
          <li>✓ Keep it to 1-2 pages maximum</li>
        </ul>
      </div>
    </div>
  );
}
