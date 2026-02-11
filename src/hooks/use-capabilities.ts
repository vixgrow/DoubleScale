/**
 * Internal dependencies
 */
import { useCallback } from '@wordpress/element';
import Config from '@quillcrm/config';

/**
 * Custom hook for checking user capabilities
 * 
 * Returns memoized functions to prevent unnecessary re-renders
 * when used as dependencies in useEffect/useMemo/useCallback.
 */
export const useCapabilities = () => {
    /**
     * Check if user has the required capability for a page
     */
    const hasRequiredCapability = useCallback((requiredCapability?: string[]): boolean => {
        if (!requiredCapability) {
            return true; // No capability required
        }

        const userCapabilities = Config.getUserCapabilities();
        return (
            requiredCapability.some(capability => userCapabilities[capability as keyof typeof userCapabilities]) ||
            false
        );
    }, []);

    /**
     * Check if current user is a sales rep (has restricted permissions - can only manage own deals)
     */
    const isSalesRep = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_sales_rep || false;
    }, []);

    /**
     * Check if current user is a sales manager (can manage all deals but not full CRM access)
     */
    const isSalesManager = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_sales_manager || false;
    }, []);

    /**
     * Check if current user can manage deals (not restricted to own deals)
     * Sales Manager, CRM Manager, and Administrator can manage all deals
     */
    const canManageAllDeals = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_crm_manager || userCapabilities.quillcrm_sales_manager || false;
    }, []);

    /**
     * Check if current user is a CRM manager (full CRM access)
     */
    const isCrmManager = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_crm_manager || false;
    }, []);

    return {
        hasRequiredCapability,
        isSalesRep,
        isSalesManager,
        canManageAllDeals,
        isCrmManager,
    };
};

export default useCapabilities;
