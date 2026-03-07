import { NextRequest } from 'next/server';
import { getSupabaseUser, unauthorized, serverError, success } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const userProfile = await db.userProfile.findUnique({
      where: { id: user.id },
    });

    const plans = {
      free: { limit: 0, price: 0, apps_per_day: 0 },
      pro: { limit: 50, price: 29, apps_per_day: 50 },
      elite: { limit: 150, price: 79, apps_per_day: 150 },
    };

    const currentPlan = userProfile?.plan || 'free';
    const currentPlanData = plans[currentPlan as keyof typeof plans];

    return success({
      billing: {
        currentPlan,
        planDetails: {
          name: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
          price: currentPlanData.price,
          applicationsPerDay: currentPlanData.apps_per_day,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        billingHistory: [
          {
            month: 'March 2026',
            plan: currentPlan,
            amount: currentPlanData.price,
            date: new Date().toISOString().split('T')[0],
          },
          {
            month: 'February 2026',
            plan: currentPlan,
            amount: currentPlanData.price,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        ],
        availablePlans: [
          {
            id: 'free',
            name: 'Free',
            price: 0,
            applicationsPerDay: 0,
            features: ['Job search', 'Resume builder (basic)', 'Manual apply only'],
            current: currentPlan === 'free',
          },
          {
            id: 'pro',
            name: 'Pro',
            price: 29,
            applicationsPerDay: 50,
            features: ['Full job search', 'Resume optimization', '50 apps/day', '10 active resumes'],
            current: currentPlan === 'pro',
          },
          {
            id: 'elite',
            name: 'Elite',
            price: 79,
            applicationsPerDay: 150,
            features: ['Everything in Pro', '150 apps/day', 'Unlimited resumes', 'Weekly coaching report'],
            current: currentPlan === 'elite',
          },
        ],
      },
    });
  } catch (err) {
    console.error('Billing fetch error:', err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getSupabaseUser(request);
  if (error) return unauthorized(error.message);

  try {
    const data = await request.json();
    const { action, newPlan } = data;

    console.log('Billing action:', { action, newPlan });

    if (action === 'upgrade') {
      // In production, integrate with Stripe here
      // For now, just update the plan
      await db.userProfile.update({
        where: { id: user.id },
        data: { plan: newPlan as any },
      });

      return success({
        message: `Upgraded to ${newPlan} plan successfully`,
        plan: newPlan,
      });
    }

    return serverError('Invalid action');
  } catch (err) {
    console.error('Billing update error:', err);
    return serverError();
  }
}
