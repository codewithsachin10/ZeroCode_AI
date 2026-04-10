import { showError, showWarning } from "./toast-system";

/**
 * Standardizes error messages across the platform into "Simple Language"
 * as per ZeroCode AI Premium Guidelines.
 */
export const handlePlatformError = (error: any, context?: string) => {
  console.error(`[Node Failure - ${context || 'General'}]:`, error);

  let message = "Something went wrong. Please try again.";

  // Firebase Auth Errors
  if (error?.code) {
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        message = "Invalid email or password.";
        break;
      case 'auth/email-already-in-use':
        message = "This email is already registered.";
        break;
      case 'auth/weak-password':
        message = "Password is too weak.";
        break;
      case 'auth/network-request-failed':
        message = "Connection error. Check your internet.";
        break;
      case 'permission-denied':
        message = "Access denied.";
        break;
      case 'not-found':
        message = "No data found.";
        break;
    }
  }

  // API Errors
  if (error?.response?.status) {
    const status = error.response.status;
    if (status === 401 || status === 403) message = "Session expired. Please login again.";
    else if (status >= 500) message = "Server error. Please try later.";
    else message = "Request failed. Try again.";
  }

  // Custom Messages
  if (typeof error === 'string') {
    if (error.toLowerCase().includes('file too large')) message = "File too large.";
    else if (error.toLowerCase().includes('invalid file type')) message = "Invalid file type.";
  }

  showError(message);
  return message;
};

export const validateForm = (data: any) => {
  if (!data) return "Please fill all fields.";
  
  for (const key in data) {
    if (!data[key]) {
       const msg = "Please fill all fields.";
       showWarning(msg);
       return msg;
    }
    
    if (key === 'email' && !data[key].includes('@')) {
       const msg = "Enter valid email.";
       showWarning(msg);
       return msg;
    }
    
    if (key === 'password' && data[key].length < 6) {
       const msg = "Password too short.";
       showWarning(msg);
       return msg;
    }
  }
  
  return null;
};
