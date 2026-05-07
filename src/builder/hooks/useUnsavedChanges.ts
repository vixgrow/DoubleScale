import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const useUnsavedChanges = ({
  hasUnsavedChanges,
  message = __('You have unsaved changes. Are you sure you want to leave?', 'doublescale'),
}: UseUnsavedChangesOptions) => {
  // Handle browser navigation (back/forward/refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  // Handle browser back/forward button with popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, message]);

  // Function to confirm navigation
  const confirmNavigation = useCallback((): boolean => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm(message);
  }, [hasUnsavedChanges, message]);

  return { confirmNavigation };
};
