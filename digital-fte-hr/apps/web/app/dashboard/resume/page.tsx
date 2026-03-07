'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ResumeVariantManager } from '@/components/resume/ResumeVariantManager';
import { Skeleton } from '@/components/ui/skeleton';

interface ResumeVariant {
  id: string;
  versionNumber: number;
  sourceType: string;
  atsScore: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function ResumePage() {
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState<ResumeVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      console.log('Loading resumes, token exists:', !!token);

      const response = await fetch('/api/v1/resumes', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      console.log('Resume API response status:', response.status);

      const data = await response.json();
      console.log('Resume API response data:', data);

      if (data.success && data.resumes) {
        console.log('Setting variants:', data.resumes);
        setVariants(data.resumes);
      } else if (!response.ok) {
        setMessage({ type: 'error', text: `❌ Failed to load resumes: ${data.error?.message || 'Unknown error'}` });
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
      setMessage({ type: 'error', text: '❌ Failed to load resumes' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: '❌ Only PDF and DOCX files are allowed' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
      const token = auth ? JSON.parse(auth).access_token : null;

      console.log('Uploading resume, token exists:', !!token);
      console.log('File:', file.name, file.type, file.size);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      console.log('Upload response status:', response.status);

      const data = await response.json();
      console.log('Upload response data:', data);

      if (data.success || response.status === 202) {
        setMessage({ type: 'success', text: '✅ Resume uploaded successfully! Loading...' });
        // Add small delay to ensure backend has committed
        await new Promise(resolve => setTimeout(resolve, 500));
        // Reload resumes
        await loadResumes();
        setMessage({ type: 'success', text: '✅ Resume uploaded and loaded!' });
      } else {
        setMessage({ type: 'error', text: `❌ Failed to upload resume: ${data.error?.message || 'Unknown error'}` });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: '❌ Error uploading resume' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateVariant = (name: string, targetRole: string) => {
    // This will be implemented in Option B (Variants & ATS Scoring)
    console.log('Create variant:', name, targetRole);
  };

  const handleDeleteVariant = (id: string) => {
    // This will be implemented later
    console.log('Delete variant:', id);
  };

  const handleSetDefault = (id: string) => {
    // This will be implemented later
    console.log('Set default:', id);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Resume Optimizer 📄</h1>
          <p className="mt-2 text-gray-600">Create and optimize ATS-friendly resumes</p>
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

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
          variants={variants.map((v) => ({
            id: v.id,
            name: `Resume v${v.versionNumber}`,
            atsScore: v.atsScore || 0,
            targetRole: v.sourceType,
            createdAt: new Date(v.createdAt),
            isDefault: v.isActive,
          }))}
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

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="text-5xl mb-4">📤</div>
        <h3 className="text-lg font-bold text-gray-900">Upload Your Resume</h3>
        <p className="mt-2 text-gray-600 mb-6">
          Upload PDF or DOCX (Max 10MB)
        </p>
        <div className="flex flex-col gap-3 justify-center sm:flex-row">
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            className="bg-primary-400 hover:bg-primary-500 text-white cursor-pointer"
            disabled={isUploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Resumes Uploaded" value={variants.length} icon="📄" />
        <DashboardCard
          title="Avg ATS Score"
          value={
            variants.length > 0
              ? Math.round(
                  variants.filter((v) => v.atsScore).reduce((acc, v) => acc + (v.atsScore || 0), 0) /
                    variants.filter((v) => v.atsScore).length
                ) + '/100'
              : 'N/A'
          }
          icon="📊"
          variant="success"
        />
        <DashboardCard
          title="Latest Version"
          value={variants.length > 0 ? `v${variants[0].versionNumber}` : 'None'}
          icon="⚡"
          variant="primary"
        />
      </div>

      {/* Uploaded Resumes List */}
      {variants.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Resumes</h3>
          <div className="space-y-3">
            {variants.map((resume) => (
              <div
                key={resume.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  resume.isActive
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Resume v{resume.versionNumber}
                        {resume.isActive && (
                          <span className="ml-2 inline-block rounded-full bg-primary-400 px-2 py-0.5 text-xs font-semibold text-white">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Type: {resume.sourceType} • Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {resume.atsScore && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-400">{resume.atsScore}</div>
                    <div className="text-xs text-gray-600">ATS Score</div>
                  </div>
                )}
                {!resume.atsScore && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Scoring...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No resumes yet. Upload your first resume above!</p>
        </div>
      )}

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
