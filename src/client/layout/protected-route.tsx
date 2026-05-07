/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

interface ProtectedRouteProps {
	page: {
		/** User needs at least one of these caps (see `useCapabilities.hasRequiredCapability`). */
		requiredCapability?: string[];
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
	useEffect(() => {
		if (
			page.requiredCapability &&
			!hasRequiredCapability(page.requiredCapability)
		) {
			// Redirect to dashboard if user doesn't have permission using navigation
			navigate(getToLink('/'));
		}
	}, [page.requiredCapability, navigate, hasRequiredCapability]);

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
