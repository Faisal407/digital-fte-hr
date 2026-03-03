import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  color?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color = 'default', ...props }, ref) => {
    const colorClasses: Record<string, string> = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };

    return (
      <div
        ref={ref}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <div
          className={cn('h-full transition-all', colorClasses[color])}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
