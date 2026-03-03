/**
 * Global UI State Management with Zustand
 * Manages sidebar collapse, theme, notifications, and other UI state
 */

import { create } from 'zustand';

export interface UIStore {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Notifications state
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal state
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  closeAllModals: () => void;

  // Search state
  jobSearchQuery: string;
  setJobSearchQuery: (query: string) => void;
  jobSearchFilters: Record<string, unknown>;
  setJobSearchFilters: (filters: Record<string, unknown>) => void;

  // Loading states
  isLoading: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;

  // User preferences
  lastVisitedPage: string;
  setLastVisitedPage: (page: string) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // ms, undefined = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

const generateToastId = () => Math.random().toString(36).substr(2, 9);

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Toasts
  toasts: [],
  addToast: (toast) => {
    const id = generateToastId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    if (toast.duration !== undefined) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  // Modals
  modals: {},
  openModal: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: true },
    })),
  closeModal: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: false },
    })),
  closeAllModals: () => set({ modals: {} }),

  // Job Search
  jobSearchQuery: '',
  setJobSearchQuery: (query) => set({ jobSearchQuery: query }),
  jobSearchFilters: {},
  setJobSearchFilters: (filters) => set({ jobSearchFilters: filters }),

  // Loading
  isLoading: {},
  setLoading: (key, loading) =>
    set((state) => ({
      isLoading: { ...state.isLoading, [key]: loading },
    })),

  // Preferences
  lastVisitedPage: '/dashboard',
  setLastVisitedPage: (page) => set({ lastVisitedPage: page }),
}));

// Helper hooks for common patterns
export const useToast = () => {
  const { addToast, removeToast, clearToasts } = useUIStore();

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message, duration: 3000 }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message, duration: 5000 }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message, duration: 4000 }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message, duration: 3000 }),
    removeToast,
    clearToasts,
  };
};

export const useModal = (key: string) => {
  const { modals, openModal, closeModal } = useUIStore();

  return {
    isOpen: modals[key] ?? false,
    open: () => openModal(key),
    close: () => closeModal(key),
    toggle: () => {
      if (modals[key]) {
        closeModal(key);
      } else {
        openModal(key);
      }
    },
  };
};
