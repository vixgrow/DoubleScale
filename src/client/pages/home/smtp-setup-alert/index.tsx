/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import { getToLink } from '@doublescale/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from '@doublescale/components';

export const SmtpSetupAlert: React.FC = () => {
	const navigate = useNavigate();
	const capabilities = ConfigAPI.getUserCapabilities();
	const isManagerOrAdmin = capabilities.doublescale_crm_manager;

	if (!isManagerOrAdmin) {
		return null;
	}

	const smtpModuleEnabled = ConfigAPI.isModuleActive('smtp');
	if (!smtpModuleEnabled) {
		return null;
	}

	const smtpInfo = ConfigAPI.getDoubleScaleInfo();
	if (smtpInfo.configured) {
		return null;
	}

	return (
		<Alert className="border-amber-200 mb-4 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
			<AlertTriangleIcon width={20} height={20} color="#D97706" />
			<AlertTitle className="text-amber-800 dark:text-amber-200">
				{__('SMTP Not Configured', 'doublescale')}
			</AlertTitle>
			<AlertDescription className="flex items-center justify-between gap-4">
				<span className="text-amber-700 dark:text-amber-300">
					{__(
						'The SMTP module is enabled but no email connection has been set up yet. Emails (campaigns, automations, notifications) will not be delivered until you configure at least one SMTP connection.',
						'doublescale'
					)}
				</span>
				<Button
					variant="outline"
					size="sm"
					className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
					onClick={() => navigate(getToLink('smtp/settings'))}
				>
					{__('Configure SMTP', 'doublescale')}
				</Button>
			</AlertDescription>
		</Alert>
	);
};

export default SmtpSetupAlert;
