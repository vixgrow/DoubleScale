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
    const hasRequiredCapability = (requiredCapability?: string): boolean => {
        if (!requiredCapability) {
            return true; // No capability required
        }

        const userCapabilities = Config.getUserCapabilities();
        return (
            userCapabilities[requiredCapability as keyof typeof userCapabilities] ||
            false
        );
    };

    /**
     * Check if current user is a deal owner (has restricted permissions)
     */
    const isDealOwner = (): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.quillcrm_deal_owner || false;
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
        isDealOwner,
        isCrmManager,
    };
};

export default useCapabilities;
