
import { toast as sonnerToast } from "sonner";

// Wrapper function to maintain compatibility with both formats
export const toast = (args: any) => {
  // If it's an object with title/description format, convert to Sonner format
  if (typeof args === 'object' && (args.title || args.description)) {
    const { title, description, variant, ...rest } = args;
    if (variant === 'destructive') {
      return sonnerToast.error(title, {
        description,
        ...rest
      });
    } else {
      return sonnerToast.success(title, {
        description,
        ...rest
      });
    }
  }
  
  // Pass through for direct use of Sonner toast
  return sonnerToast(args);
};

// Re-export the original toast for direct access to methods
export { sonnerToast };
