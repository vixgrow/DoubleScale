/**
 * Internal dependencies
 */
import Config from '@quillcrm/config';

/**
 * Custom hook for checking user capabilities
 */
export const useCapabilities = () => {
    /**
     * Check if user has the required capability for a page
     */
    const hasRequiredCapability = (requiredCapability?: string[]): boolean => {

        if (!requiredCapability) {
            return true; // No capability required
        }

        const userCapabilities = Config.getUserCapabilities();
        return (
            requiredCapability.some(capability => userCapabilities[capability as keyof typeof userCapabilities]) ||
            false
        );
    };

    /**
     * Check if current user is a sales rep (has restricted permissions)
     */
    const isSalesRep = (): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_sales_rep || false;
    };

    /**
     * Check if current user can manage deals (not restricted to own deals)
     */
    const isCrmManager = (): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_crm_manager || false;
    };

    return {
        hasRequiredCapability,
        isSalesRep,
        isCrmManager,
    };
};

export default useCapabilities;
