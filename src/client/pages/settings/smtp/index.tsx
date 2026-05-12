/**
 * SMTP settings UI lives in DoubleScale Pro. This file remains so the free
 * settings router can register the tab; when Pro is active it replaces this
 * component via `doublescale_settings_smtp_settings`.
 *
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Free build: no SMTP connection wizard or mailer configuration here.
 */
const SmtpSettingsProOnly: React.FC = () => {
	return (
		<div className="smtp-settings max-w-2xl space-y-4">
			<div className="text-foreground text-2xl font-semibold">
				{__('SMTP / Email Sending', 'doublescale')}
			</div>
			<Alert>
				<AlertTitle>{__('Available in DoubleScale Pro', 'doublescale')}</AlertTitle>
				<AlertDescription className="text-sm leading-relaxed">
					{__(
						'Advanced SMTP setup, connection manager, email log, and bounce webhooks are provided by the Pro add-on. Install and activate DoubleScale Pro to configure outbound mail from this screen.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>
		</div>
	);
};

export default SmtpSettingsProOnly;
