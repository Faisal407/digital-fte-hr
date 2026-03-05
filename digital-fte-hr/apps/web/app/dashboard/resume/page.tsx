'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ResumeVariantManager } from '@/components/resume/ResumeVariantManager';

interface ResumeVariant {
  id: string;
  name: string;
  atsScore: number;
  targetRole?: string;
  createdAt: Date;
  isDefault: boolean;
}

export default function ResumePage() {
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState<ResumeVariant[]>([
    {
      id: '1',
      name: 'General Purpose',
      atsScore: 78,
      targetRole: 'Product Manager',
      createdAt: new Date(),
      isDefault: true,
    },
  ]);

  const handleCreateVariant = (name: string, targetRole: string) => {
    const newVariant: ResumeVariant = {
      id: String(variants.length + 1),
      name,
      atsScore: Math.floor(Math.random() * 30) + 65,
      targetRole,
      createdAt: new Date(),
      isDefault: false,
    };
    setVariants([...variants, newVariant]);
  };

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setVariants(
      variants.map((v) => ({
        ...v,
        isDefault: v.id === id,
      }))
    );
  };

  if (showVariants) {
    return (
      <div className="space-y-8">
        <div>
          <Button
            onClick={() => setShowVariants(false)}
            variant="outline"
            className="border-gray-300 mb-4"
          >
            ← Back to Upload
          </Button>
        </div>
        <ResumeVariantManager
          variants={variants}
          onCreateVariant={handleCreateVariant}
          onDeleteVariant={handleDeleteVariant}
          onSetDefault={handleSetDefault}
        />
      </div>
    );
  }

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
        <DashboardCard title="Resumes Created" value={variants.length} icon="📄" />
        <DashboardCard
          title="Avg ATS Score"
          value={Math.round(variants.reduce((acc, v) => acc + v.atsScore, 0) / variants.length) + '/100'}
          icon="📊"
          variant="success"
        />
        <DashboardCard title="Optimized" value={variants.length} icon="⚡" variant="primary" />
      </div>

      {/* Resume Variants Section */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Resume Variants</h3>
            <p className="text-sm text-gray-600 mt-1">Create tailored versions for different roles</p>
          </div>
          <Button
            onClick={() => setShowVariants(true)}
            className="bg-primary-400 hover:bg-primary-500 text-white"
          >
            Manage Variants →
          </Button>
        </div>
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
