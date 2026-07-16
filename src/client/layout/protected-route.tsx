/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import config from '@doublescale/config';

interface ProtectedRouteProps {
	page: {
		requiredCapability?: string[];
		/** When set, user is redirected away unless this module is enabled in admin config. */
		requiresModule?: string;
		/** When true, skip the module-gate redirect so the component can render its own Pro notice. */
		alwaysRegister?: boolean;
		component?: React.ComponentType;
	};
	children?: React.ReactNode;
}

/**
 * Protected route component that checks if user has required permissions
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ page, children }) => {
	const navigate = useNavigate();
	const { hasRequiredCapability } = useCapabilities();
	const [moduleGateEpoch, setModuleGateEpoch] = useState(0);

	useEffect(() => {
		const bump = () => setModuleGateEpoch((n) => n + 1);
		window.addEventListener('doublescale:modules-updated', bump);
		return () => window.removeEventListener('doublescale:modules-updated', bump);
	}, []);

	useEffect(() => {
		if (
			page.requiredCapability &&
			!hasRequiredCapability(page.requiredCapability)
		) {
			const fallbackPath = config.getUserCapabilities().doublescale_is_project_only
				? 'projects'
				: '/';
			navigate(getToLink(fallbackPath));
		}
	}, [page.requiredCapability, navigate, hasRequiredCapability]);

	useEffect(() => {
		if (
			page.requiresModule &&
			!page.alwaysRegister &&
			!config.isModuleToggleEnabled(page.requiresModule)
		) {
			navigate(getToLink('/'), { replace: true });
		}
	}, [page.requiresModule, page.alwaysRegister, navigate, moduleGateEpoch]);

	if (
		page.requiresModule &&
		!page.alwaysRegister &&
		!config.isModuleToggleEnabled(page.requiresModule)
	) {
		return null;
	}

	// If user doesn't have permission, return null or loading state
	if (
		page.requiredCapability &&
		!hasRequiredCapability(page.requiredCapability)
	) {
		return (
			<div className="doublescale-access-denied">
				<h2>{__('Access Denied', 'doublescale')}</h2>
				<p>
					{__(
						'You do not have permission to access this page.',
						'doublescale'
					)}
				</p>
			</div>
		);
	}

	// @ts-ignore
	return children || <page.component />;
};

export default ProtectedRoute;
