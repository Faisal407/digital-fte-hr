import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, notFound, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  const { taskId } = params;

  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return notFound('Task not found');
    if (task.userId !== user.id) return unauthorized('You do not have access to this task');

    // If task is still pending/processing, return status
    if (task.status === 'pending' || task.status === 'processing') {
      return success({
        taskId,
        status: task.status,
        progress: task.progress,
        message: 'Job search in progress...',
      });
    }

    // If task is completed, search for jobs matching the query
    if (task.status === 'completed' && task.resultData === null) {
      const inputData = task.inputData as { query: string };
      const query = inputData.query || '';

      // Search jobs by title or description containing query
      const jobs = await db.jobListing.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { companyName: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { postedAt: 'desc' },
        take: 12,
      });

      const jobMatches = jobs.map((job) => ({
        id: job.id,
        externalId: job.externalId,
        platform: job.platform,
        title: job.title,
        company: {
          name: job.companyName,
          logo: job.companyLogoUrl || 'https://via.placeholder.com/40',
        },
        location: job.location,
        isRemote: job.isRemote,
        salary: job.salaryMin
          ? {
              min: job.salaryMin,
              max: job.salaryMax || job.salaryMin,
              currency: job.salaryCurrency || 'USD',
              period: job.salaryPeriod || 'year',
            }
          : null,
        description: job.description.substring(0, 200) + '...',
        postedAt: `${Math.floor((Date.now() - job.postedAt.getTime()) / (24 * 60 * 60 * 1000))} days ago`,
        applicationUrl: job.applicationUrl,
        matchScore: 75 + Math.floor(Math.random() * 20), // Random match score for demo
        isGhostJob: job.isGhostJob,
        atsType: job.atsType || 'Unknown',
        skills: ['Product Management', 'Strategy', 'Analytics'],
      }));

      return success({
        taskId,
        status: 'complete',
        jobs: jobMatches,
        total: jobMatches.length,
        processingTime: 1200,
        platformsSearched: [
          { platform: 'Database', count: jobMatches.length, time: 150 },
        ],
      });
    }

    // Task failed
    return success({
      taskId,
      status: task.status,
      error: task.errorReason,
    });
  } catch (err) {
    console.error('Job search error:', err);
    return serverError();
  }
}
