/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginStatusCard } from '@/components/plugin-installer';
import { ProFeatureNotice } from '@quillcrm/components/pro-feature-notice';

const SMTPSettings: React.FC = () => {
	return (
		<div className="smtp-settings">
			<div className="text-[#09090B] font-semibold text-2xl mb-6">
				{__('SMTP / Email Sending Service Settings', 'quillcrm')}
			</div>

			<PluginStatusCard
				plugin={{
					id: 'quill-smtp',
					name: __('QuillSMTP', 'quillcrm'),
					description: __(
						'QuillSMTP is not installed. Install and configure QuillSMTP for reliable email delivery with support for multiple SMTP providers including SendGrid, Mailgun, SES, and more.',
						'quillcrm'
					),
					pluginFile: 'quill-smtp/quillsmtp.php',
					downloadUrl:
						'https://downloads.wordpress.org/plugin/quill-smtp.1.5.3.zip',
					settingsUrl: '/wp-admin/admin.php?page=quill-smtp#/connections',
				}}
				variant="default"
			/>

			{/* Bounce Handler - Pro Feature */}
			<div className="mt-8 pt-8 border-t border-gray-200">
				<div className="text-[#09090B] font-semibold text-xl mb-4">
					{__('Bounce Handler', 'quillcrm')}
				</div>
				<ProFeatureNotice
					featureName={__('Email Bounce Handler', 'quillcrm')}
					description={__(
						'Automatically handle bounced emails with webhook integrations for SendGrid, Mailgun, Amazon SES, Postmark, and other major email service providers. Keep your contact list clean by automatically marking hard bounces and tracking soft bounces.',
						'quillcrm'
					)}
				/>
			</div>
		</div>
	);
};

export default SMTPSettings;
