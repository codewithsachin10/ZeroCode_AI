import { toast } from "sonner";

/**
 * Global Premium Toast System for ZeroCode AI.
 * Handles Success, Error, Warning, and Info states with minimal UI.
 */
export const toastSystem = {
  success: (message: string) => {
    toast.success(message, {
      className: "premium-toast success",
      duration: 3000,
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      className: "premium-toast error",
      duration: 4000,
    });
  },
  
  warning: (message: string) => {
    toast(message, {
      className: "premium-toast warning",
      duration: 3500,
    });
  },
  
  info: (message: string) => {
    toast.info(message, {
      className: "premium-toast info",
      duration: 3000,
    });
  }
};

// Direct exports for easier usage
export const showSuccess = toastSystem.success;
export const showError = toastSystem.error;
export const showWarning = toastSystem.warning;
export const showInfo = toastSystem.info;
