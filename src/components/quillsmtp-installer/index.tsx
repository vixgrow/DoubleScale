/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginStatusCard } from '@/components/plugin-installer';
import config from '@doublescale/config';

export const QuillSMTPInstaller: React.FC = () => {
	const adminUrl = config.getAdminUrl();
	const settingsUrl = `${adminUrl}admin.php?page=quillsmtp&path=settings`;

	return (
		<PluginStatusCard
			plugin={{
				id: 'quillsmtp',
				name: __('QuillSMTP', 'doublescale'),
				description: __(
					'QuillSMTP is not installed. Install and configure QuillSMTP for reliable email delivery with support for multiple SMTP providers including SendGrid, Mailgun, SES, and more.',
					'doublescale'
				),
				pluginFile: 'quillsmtp/quillsmtp.php',
				downloadUrl:
					'https://downloads.wordpress.org/plugin/quill-smtp.1.5.3.zip',
				settingsUrl: settingsUrl,
			}}
			variant="default"
		/>
	);
};
