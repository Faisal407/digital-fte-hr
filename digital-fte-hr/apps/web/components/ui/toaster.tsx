'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'success':
        return { icon: '✓', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
      case 'error':
        return { icon: '✕', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
      case 'warning':
        return { icon: '!', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' };
      case 'info':
      default:
        return { icon: 'ℹ', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => {
        const { icon, bg, border, text } = getIconAndColor(toast.type);

        // Auto-remove after duration
        useEffect(() => {
          if (toast.duration !== Infinity) {
            const timeout = setTimeout(
              () => removeToast(toast.id),
              toast.duration || 4000
            );
            return () => clearTimeout(timeout);
          }
        }, [toast.id, toast.duration]);

        return (
          <div
            key={toast.id}
            className={cn(
              'rounded-lg border px-4 py-3 flex items-start gap-3 animate-in slide-in-from-right fade-in',
              bg,
              border
            )}
            role="alert"
          >
            <span className={cn('text-lg font-bold flex-shrink-0', text)}>{icon}</span>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className={cn('font-semibold text-sm', text)}>
                  {toast.title}
                </p>
              )}
              {toast.message && (
                <p className={cn('text-sm mt-0.5', text)}>
                  {toast.message}
                </p>
              )}
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick?.();
                  removeToast(toast.id);
                }}
                className={cn(
                  'text-sm font-medium px-3 py-1 rounded hover:opacity-80 transition-opacity flex-shrink-0',
                  bg,
                  border,
                  text
                )}
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className={cn('text-lg flex-shrink-0 hover:opacity-60 transition-opacity', text)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
