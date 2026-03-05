'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function DashboardCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  children,
  onClick,
  variant = 'default',
}: DashboardCardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border p-6 transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        variantStyles[variant],
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            {icon && <span className="text-2xl">{icon}</span>}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600',
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </>
      )}
    </div>
  );
}
