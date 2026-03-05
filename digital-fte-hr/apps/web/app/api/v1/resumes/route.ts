import { NextRequest, NextResponse } from 'next/server'; // NextRequest used in POST

const mockResumes = [
  {
    id: 'resume-1',
    versionNumber: 1,
    sourceType: 'upload',
    atsScore: 87,
    isActive: true,
    createdAt: '2024-03-01',
    checkpoints: {
      total: 23,
      passed: 20,
      highlights: ['No tables', 'ATS keywords', 'Proper formatting'],
    },
  },
  {
    id: 'resume-2',
    versionNumber: 2,
    sourceType: 'form',
    atsScore: 92,
    isActive: false,
    createdAt: '2024-03-03',
    checkpoints: {
      total: 23,
      passed: 23,
      highlights: ['Perfect formatting', 'All keywords present', 'No errors'],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      resumes: mockResumes,
      total: mockResumes.length,
      activeResume: mockResumes.find((r) => r.isActive),
    },
    meta: {
      processingTime: 35,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'file is required',
          },
        },
        { status: 400 }
      );
    }

    const newResume = {
      id: 'resume-' + Date.now(),
      versionNumber: mockResumes.length + 1,
      sourceType: 'upload',
      atsScore: null,
      isActive: false,
      createdAt: new Date().toISOString(),
      checkpoints: null,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          resume: newResume,
          message: 'Resume uploaded successfully. Processing ATS score...',
        },
        meta: {
          processingTime: 128,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload resume',
        },
      },
      { status: 500 }
    );
  }
}
