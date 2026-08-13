/**
 * Internal dependencies
 */
import { useCallback } from '@wordpress/element';
import Config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';

/**
 * Default SPA landing path for users scoped to a single module.
 */
export const getScopedDefaultLandingPath = (): string => {
	const caps = Config.getUserCapabilities();

	// `projects` is a Pro-only route (see registerAdminPage('projects', {
	// requiresPro: true })) — it isn't registered at all on Free, so routing
	// a project-only free user there would fall straight into the catch-all
	// redirect again and loop.
	if (caps.doublescale_is_project_only && isProActive()) {
		return 'projects';
	}

	if (caps.doublescale_is_booking_only) {
		return 'booking';
	}

	if (caps.doublescale_is_support_only) {
		return 'support';
	}

	return '/';
};

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
        return userCapabilities.doublescale_sales_rep || false;
    }, []);

    /**
     * Check if current user is a sales manager (can manage all deals but not full CRM access)
     */
    const isSalesManager = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.doublescale_sales_manager || false;
    }, []);

    /**
     * Check if current user can manage deals (not restricted to own deals)
     * Sales Manager, CRM Manager, and Administrator can manage all deals
     */
    const canManageAllDeals = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.doublescale_crm_manager || userCapabilities.doublescale_sales_manager || false;
    }, []);

    /**
     * Check if current user is a CRM manager (full CRM access)
     */
    const isCrmManager = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.doublescale_crm_manager || false;
    }, []);

    /**
     * Settings limited to Mailbox + Notifications (Sales Rep / Sales Manager only).
     * Prefer the PHP-computed flag so CRM Manager + Sales Rep multi-role users
     * keep full settings access.
     */
    const hasLimitedSettingsAccess = useCallback((): boolean => {
        const caps = Config.getUserCapabilities();
        if (typeof caps.doublescale_limited_settings === 'boolean') {
            return caps.doublescale_limited_settings;
        }
        return (
            !caps.doublescale_crm_manager &&
            Boolean(caps.doublescale_sales_rep || caps.doublescale_sales_manager)
        );
    }, []);

    /**
     * Settings → MCP: WordPress administrators only. CRM Manager can use the
     * CRM but cannot enable the site-wide MCP endpoint or issue API keys.
     */
    const canManageMcp = useCallback((): boolean => {
        const caps = Config.getUserCapabilities();
        return Boolean(caps.doublescale_manage_mcp);
    }, []);

    /**
     * Check if current user can see and manage every support ticket.
     * Granted to administrators, CRM Managers, and Support Managers (NOT Sales
     * roles). Used to hide reassign/delete UI from Support Agents (who only see
     * tickets assigned to them).
     */
    const canManageAllTickets = useCallback((): boolean => {
        const userCapabilities = Config.getUserCapabilities();
        return userCapabilities.doublescale_manage_all_tickets || false;
    }, []);

    const hasProjectAccess = useCallback((): boolean => {
        const caps = Config.getUserCapabilities() as Record<string, boolean | undefined>;
        return Boolean(
            caps.doublescale_project_read_own_projects ||
                caps.doublescale_project_read_all_projects ||
                caps.doublescale_project_manage_own_projects ||
                caps.doublescale_project_manage_all_projects
        );
    }, []);

    const canManageAllProjects = useCallback((): boolean => {
        const caps = Config.getUserCapabilities() as Record<string, boolean | undefined>;
        return Boolean(caps.doublescale_project_manage_all_projects);
    }, []);

    const isProjectOnly = useCallback((): boolean => {
        const caps = Config.getUserCapabilities();
        return caps.doublescale_is_project_only || false;
    }, []);

    return {
        hasRequiredCapability,
        isSalesRep,
        isSalesManager,
        canManageAllDeals,
        isCrmManager,
        hasLimitedSettingsAccess,
        canManageMcp,
        canManageAllTickets,
        hasProjectAccess,
        canManageAllProjects,
        isProjectOnly,
    };
};

export default useCapabilities;
