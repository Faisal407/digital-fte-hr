import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, badRequest, serverError, success, accepted } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    console.log('Fetching resumes for user:', user.id);

    const resumes = await db.resumeProfile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Found resumes:', resumes.length);

    const activeResume = resumes.find((r) => r.isActive);

    const formattedResumes = resumes.map((r) => ({
      id: r.id,
      versionNumber: r.versionNumber,
      sourceType: r.sourceType,
      atsScore: r.atsScore,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString().split('T')[0],
      checkpoints: r.checkpoints,
    }));

    return success({
      resumes: formattedResumes,
      total: formattedResumes.length,
      activeResume: activeResume
        ? {
            id: activeResume.id,
            versionNumber: activeResume.versionNumber,
            atsScore: activeResume.atsScore,
          }
        : null,
    });
  } catch (err) {
    console.error('Resumes fetch error:', err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    console.log('Uploading resume for user:', user.id);

    const formData = await request.formData();
    const file = formData.get('file');

    console.log('File received:', file ? 'yes' : 'no', file instanceof File);

    if (!file) {
      return badRequest('file is required');
    }

    // Get next version number
    const lastResume = await db.resumeProfile.findFirst({
      where: { userId: user.id },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersion = (lastResume?.versionNumber || 0) + 1;
    console.log('Next version number:', nextVersion);

    // Create resume record
    const newResume = await db.resumeProfile.create({
      data: {
        userId: user.id,
        versionNumber: nextVersion,
        sourceType: 'upload',
        s3KeyOriginal: `resumes/${user.id}/resume-v${nextVersion}.pdf`,
        isActive: false,
      },
    });

    console.log('Resume created:', newResume.id);

    return accepted({
      resume: {
        id: newResume.id,
        versionNumber: newResume.versionNumber,
        sourceType: newResume.sourceType,
        atsScore: null,
        isActive: newResume.isActive,
        createdAt: newResume.createdAt.toISOString(),
      },
      message: 'Resume uploaded successfully. Processing ATS score...',
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return serverError();
  }
}
