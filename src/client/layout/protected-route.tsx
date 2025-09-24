/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';

interface ProtectedRouteProps {
	page: {
		requiredCapability?: string;
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
	}, [page.requiredCapability, navigate]);

	// If user doesn't have permission, return null or loading state
	if (
		page.requiredCapability &&
		!hasRequiredCapability(page.requiredCapability)
	) {
		return (
			<div className="qcrm-access-denied">
				<h2>{__('Access Denied', 'quillcrm')}</h2>
				<p>
					{__(
						'You do not have permission to access this page.',
						'quillcrm'
					)}
				</p>
			</div>
		);
	}

	// @ts-ignore
	return children || <page.component />;
};

export default ProtectedRoute;
