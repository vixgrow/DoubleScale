/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardLayout from '../card-layout';
import { CampaignsIcon, EditIcon } from '@quillcrm/components';

interface CampaignSettingsCardProps {
	campaignType?: string;
	fromName: string;
	fromEmail?: string;
	replyTo?: string;
	emailSubject?: string;
	previewText?: string;
	templateName?: string;
	templateBody?: string;
	onEdit?: () => void;
	button?: boolean;
}

const CampaignSettingsCard: React.FC<CampaignSettingsCardProps> = ({
	campaignType = 'email',
	fromName,
	fromEmail,
	replyTo,
	emailSubject,
	previewText,
	templateName,
	templateBody,
	onEdit,
	button = true,
}) => {
	const isSMS = campaignType === 'sms';
	const isWhatsApp = campaignType === 'whatsapp';

	const renderContent = () => {
		if (isSMS) {
			// SMS Layout - No sender fields (uses global Twilio phone number)
			return (
				<div className="text-center py-4">
					<p className="text-base text-gray-500">
						{__('SMS campaigns use the phone number configured in Twilio integration settings.', 'quillcrm')}
					</p>
				</div>
			);
		}

		if (isWhatsApp) {
			// WhatsApp Layout - Shows template info
			return (
				<div className="space-y-4">
					<div>
						<p className="text-base text-gray-500 mb-1">
							{__('Template', 'quillcrm')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{templateName || '-'}
						</p>
					</div>
					{templateBody && (
						<div>
							<p className="text-base text-gray-500 mb-1">
								{__('Message Preview', 'quillcrm')}
							</p>
							<p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
								{templateBody}
							</p>
						</div>
					)}
					<div className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
						<p>
							{__('WhatsApp campaigns use the phone number configured in Twilio integration settings.', 'quillcrm')}
						</p>
					</div>
				</div>
			);
		}

		// Email Layout - All fields
		return (
			<>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<p className="text-base text-gray-500 mb-1">
							{__('From Name', 'quillcrm')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{fromName}
						</p>
					</div>
					<div>
						<p className="text-base text-gray-500 mb-1">
							{__('From Email', 'quillcrm')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{fromEmail}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div>
						<p className="text-base text-gray-500 mb-1">
							{__('Reply to', 'quillcrm')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{replyTo}
						</p>
					</div>

					<div>
						<p className="text-base text-gray-500 mb-1">
							{__('Subject', 'quillcrm')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{emailSubject}
						</p>
					</div>
				</div>

				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Preview Text', 'quillcrm')}
					</p>
					<p className="text-base font-semibold text-gray-900">{previewText}</p>
				</div>
			</>
		);
	};

	return (
		<CardLayout
			icon={<CampaignsIcon />}
			header={__('Campaign Settings', 'quillcrm')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit', 'quillcrm')}
			onButtonClick={onEdit}
			button={button}
		>
			<div className="space-y-4">
				{renderContent()}
			</div>
		</CardLayout>
	);
};

export default CampaignSettingsCard;
