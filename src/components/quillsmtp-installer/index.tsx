/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginStatusCard } from '@/components/plugin-installer';

export const QuillSMTPInstaller: React.FC = () => {
	return (
		<PluginStatusCard
			plugin={{
				id: 'quillsmtp',
				name: __('QuillSMTP', 'quillcrm'),
				description: __(
					'QuillSMTP is not installed. Install and configure QuillSMTP for reliable email delivery with support for multiple SMTP providers including SendGrid, Mailgun, SES, and more.',
					'quillcrm'
				),
				pluginFile: 'quillsmtp/quillsmtp.php',
				downloadUrl:
					'https://downloads.wordpress.org/plugin/quill-smtp.1.5.3.zip',
				settingsUrl: '/wp-admin/admin.php?page=quillsmtp#/connections',
			}}
			variant="default"
		/>
	);
};
