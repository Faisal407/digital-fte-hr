'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType | undefined>(undefined);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a Sheet');
  }
  return context;
}

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SheetTrigger({ children, ...props }: SheetTriggerProps) {
  const { setOpen } = useSheet();
  return (
    <button onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function SheetContent({ children, side = 'left', className, ...props }: SheetContentProps) {
  const { open, setOpen } = useSheet();

  if (!open) return null;

  const sideClasses = {
    left: 'inset-y-0 left-0 h-full w-3/4 sm:w-1/3',
    right: 'inset-y-0 right-0 h-full w-3/4 sm:w-1/3',
    top: 'inset-x-0 top-0 w-full h-1/3',
    bottom: 'inset-x-0 bottom-0 w-full h-1/3',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className={cn(
          'fixed z-50 gap-4 bg-white shadow-lg transition-all duration-300',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SheetHeader({ className, children, ...props }: SheetHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b border-gray-200 p-4', className)} {...props}>
      {children}
    </div>
  );
}

interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export function SheetClose({ children, className, ...props }: SheetCloseProps) {
  const { setOpen } = useSheet();
  return (
    <button
      onClick={() => setOpen(false)}
      className={cn('text-lg font-medium text-gray-600 hover:text-gray-900', className)}
      {...props}
    >
      {children || '✕'}
    </button>
  );
}
