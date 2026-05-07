/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { QuillSMTPInstaller } from '@/components/quillsmtp-installer';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import Config from '@doublescale/config';
import { Card } from '@doublescale/components/ui/card';
import { Button } from '@doublescale/components/ui/button';

const SMTPSettings: React.FC = () => {
	const smtpConfig = Config.getQuillSMTPInfo();
	const connectionCount = smtpConfig.verified_senders?.length || 0;

	return (
		<div className="smtp-settings">
			<div className="text-[#09090B] font-semibold text-2xl mb-6">
				{__('SMTP / Email Sending Service Settings', 'doublescale')}
			</div>
			{smtpConfig.configured ? (
				<Card className="p-6 bg-[#D1FAE5] border border-[#10B981] rounded-lg">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-[#065F46] mb-2 flex items-center gap-2">
								Quill SMTP {__('Active', 'doublescale')}
								<svg
									className="w-5 h-5 text-[#10B981]"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
							</h3>
							<div className="flex items-center gap-3 mt-3">
								<p className="text-sm text-[#065F46]">
									{__('Connections', 'doublescale')}: <span className="font-semibold">{connectionCount}</span>
								</p>
								{connectionCount === 0 && (
									<svg
										className="w-5 h-5 text-[#F59E0B]"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
								)}
								{smtpConfig.config_url && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											window.location.href = smtpConfig.config_url!;
										}}
										className="ml-auto"
									>
										{__('Manage Connections', 'doublescale')}
									</Button>
								)}
							</div>
						</div>
					</div>
				</Card>
			) : (
				<QuillSMTPInstaller />
			)}

			{/* Bounce Handler - Pro Feature */}
			<div className="mt-8 pt-8 border-t border-gray-200">
				<div className="text-[#09090B] font-semibold text-xl mb-4">
					{__('Bounce Handler', 'doublescale')}
				</div>
				<ProFeatureNotice
					featureName={__('Email Bounce Handler', 'doublescale')}
					description={__(
						'Automatically handle bounced emails with webhook integrations for SendGrid, Mailgun, Amazon SES, Postmark, and other major email service providers. Keep your contact list clean by automatically marking hard bounces and tracking soft bounces.',
						'doublescale'
					)}
				/>
			</div>
		</div>
	);
};

export default SMTPSettings;
