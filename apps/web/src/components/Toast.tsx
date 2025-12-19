'use client';

/**
 * Accessible Toast Notification Component
 * Uses ARIA live regions for screen reader announcements
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      role="status"
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`${bgColors[message.type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      <span className="text-xl font-bold" aria-hidden="true">
        {icons[message.type]}
      </span>
      <p className="flex-1">{message.message}</p>
      <button
        onClick={() => onDismiss(message.id)}
        className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
        aria-label="Dismiss notification"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
      role="region"
    >
      <div className="pointer-events-auto flex flex-col gap-3">
        {messages.map((message) => (
          <Toast key={message.id} message={message} onDismiss={onDismiss} />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Toast Context and Hook
import { createContext, useContext, useCallback } from 'react';

interface ToastContextValue {
  showToast: (message: string, type: ToastMessage['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'], duration = 5000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer messages={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
