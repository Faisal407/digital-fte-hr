'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BillingData {
  currentPlan: string;
  planDetails: {
    name: string;
    price: number;
    applicationsPerDay: number;
    nextBillingDate: string;
  };
  billingHistory: Array<{
    month: string;
    plan: string;
    amount: number;
    date: string;
  }>;
  availablePlans: Array<{
    id: string;
    name: string;
    price: number;
    applicationsPerDay: number;
    features: string[];
    current: boolean;
  }>;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load billing info on mount
  useEffect(() => {
    const loadBilling = async () => {
      try {
        const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
        const token = auth ? JSON.parse(auth).access_token : null;

        const response = await fetch('/api/v1/settings/billing', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (data.success && data.billing) {
          setBilling(data.billing);
        }
      } catch (err) {
        console.error('Failed to load billing:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBilling();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === billing?.currentPlan) {
      return; // Already on this plan
    }

    setIsUpgrading(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/settings/billing', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upgrade',
          newPlan: planId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Upgraded to ${planId} plan!` });
        // Reload billing info
        const billingResponse = await fetch('/api/v1/settings/billing', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const billingData = await billingResponse.json();
        if (billingData.success) {
          setBilling(billingData.billing);
        }
      } else {
        setMessage({ type: 'error', text: '❌ Failed to upgrade plan' });
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setMessage({ type: 'error', text: '❌ Error upgrading plan' });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!billing) {
    return <div>Failed to load billing information</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="mt-1 text-gray-600">Manage your subscription and view billing history</p>
      </div>

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

      {/* Current Plan */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border-2 border-[#00F0A0]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{billing.planDetails.name}</h3>
              <p className="text-gray-600 mt-2">
                ${billing.planDetails.price}/month • {billing.planDetails.applicationsPerDay} applications/day
              </p>
              <p className="text-sm text-gray-600 mt-4">
                Next billing date: {new Date(billing.planDetails.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
            <Badge className="bg-[#00F0A0] text-black text-lg px-4 py-2">Current</Badge>
          </div>
        </div>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {billing.availablePlans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 ${plan.current ? 'border-[#00F0A0] border-2' : ''}`}
            >
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${plan.price}
                <span className="text-lg text-gray-600">/month</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">{plan.applicationsPerDay} applications/day</p>

              <ul className="mt-6 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-[#00F0A0] font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.current || isUpgrading}
                className={`w-full mt-6 ${
                  plan.current
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#00F0A0] hover:bg-[#00d98a] text-black'
                }`}
              >
                {plan.current ? 'Current Plan' : isUpgrading ? 'Upgrading...' : 'Choose Plan'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
        <div className="space-y-3">
          {billing.billingHistory.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center pb-3 border-b border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{item.month} - {item.plan.charAt(0).toUpperCase() + item.plan.slice(1)} Plan</p>
                <p className="text-sm text-gray-600">Charged on {new Date(item.date).toLocaleDateString()}</p>
              </div>
              <p className="font-semibold text-gray-900">${item.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
