/**
 * Simple Toast Notification Composable
 */

import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast() {
  const addToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000
  ) => {
    const id = toastId++;
    toasts.value.push({ id, message, type, duration });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (message: string, duration?: number) => {
    addToast(message, 'success', duration);
  };

  const error = (message: string, duration?: number) => {
    addToast(message, 'error', duration);
  };

  const info = (message: string, duration?: number) => {
    addToast(message, 'info', duration);
  };

  const warning = (message: string, duration?: number) => {
    addToast(message, 'warning', duration);
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
