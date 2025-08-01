import { useState } from 'react';

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useCustomToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: string;
  }>>([]);

  const showToast = (message: string, options: ToastOptions = {}) => {
    const { type = 'info', duration = 5000 } = options;
    
    const id = Date.now().toString();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    // For now, just log to console - replace with actual toast implementation
    console.log(`Toast [${type.toUpperCase()}]:`, message);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    showToast,
    removeToast,
    toasts
  };
};