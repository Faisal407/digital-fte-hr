'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResumeVariant {
  id: string;
  name: string;
  atsScore: number;
  targetRole?: string;
  targetCompany?: string;
  createdAt: Date;
  isDefault: boolean;
}

interface ResumeVariantManagerProps {
  variants?: ResumeVariant[];
  onCreateVariant?: (name: string, targetRole: string) => void;
  onDeleteVariant?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

export function ResumeVariantManager({
  variants = [],
  onCreateVariant,
  onDeleteVariant,
  onSetDefault,
}: ResumeVariantManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetRole: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!formData.name || !formData.targetRole) return;
    setIsCreating(true);
    onCreateVariant?.(formData.name, formData.targetRole);
    setTimeout(() => {
      setIsCreating(false);
      setFormData({ name: '', targetRole: '' });
      setShowCreateForm(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Resume Variants</h3>
          <p className="mt-1 text-sm text-gray-600">
            Create tailored resume versions for different roles
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-400 hover:bg-primary-500 text-white"
        >
          {showCreateForm ? 'Cancel' : '+ New Variant'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="variant-name">Variant Name</Label>
              <Input
                id="variant-name"
                placeholder="e.g., Product Manager - Growth"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g., Senior Product Manager"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !formData.name || !formData.targetRole}
                className="bg-primary-400 hover:bg-primary-500 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Variant'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No variants yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={`rounded-lg border p-4 transition-all ${
                variant.isDefault
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{variant.name}</h4>
                    {variant.isDefault && (
                      <span className="inline-block rounded-full bg-primary-400 px-2 py-0.5 text-xs font-semibold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    📍 {variant.targetRole || 'General'}
                  </p>

                  {/* ATS Score */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-gray-600">ATS Score</span>
                        <span className="text-sm font-bold text-primary-400">{variant.atsScore}/100</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary-400"
                          style={{ width: `${variant.atsScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </Button>
                  {!variant.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      onClick={() => onSetDefault?.(variant.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteVariant?.(variant.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
        <h4 className="font-semibold text-blue-900">💡 Pro Tips</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Create variants for different job types (E.g., Product Mgr, Engineering Lead)</li>
          <li>• Use different keywords based on job description</li>
          <li>• Our AI will optimize each variant's ATS score</li>
        </ul>
      </div>
    </div>
  );
}
