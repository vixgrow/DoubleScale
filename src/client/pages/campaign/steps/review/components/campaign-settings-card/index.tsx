/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardLayout from '../card-layout';
import { CampaignsIcon, EditIcon } from '@doublescale/components';

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
						{__('SMS campaigns use the phone number configured in Twilio integration settings.', 'doublescale')}
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
							{__('Template', 'doublescale')}
						</p>
						<p className="text-base font-semibold text-gray-900">
							{templateName || '-'}
						</p>
					</div>
					{templateBody && (
						<div>
							<p className="text-base text-gray-500 mb-1">
								{__('Message Preview', 'doublescale')}
							</p>
							<p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
								{templateBody}
							</p>
						</div>
					)}
					<div className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
						<p>
							{__('WhatsApp campaigns use the phone number configured in Twilio integration settings.', 'doublescale')}
						</p>
					</div>
				</div>
			);
		}

		// Email Layout - All fields
		return (
			<>
				<div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					<div className="min-w-0">
						<p className="mb-1 text-base text-gray-500">
							{__('From Name', 'doublescale')}
						</p>
						<p className="break-words text-base font-semibold text-gray-900">
							{fromName}
						</p>
					</div>
					<div className="min-w-0">
						<p className="mb-1 text-base text-gray-500">
							{__('From Email', 'doublescale')}
						</p>
						<p className="break-all text-base font-semibold text-gray-900">
							{fromEmail}
						</p>
					</div>

					<div className="min-w-0">
						<p className="mb-1 text-base text-gray-500">
							{__('Reply to', 'doublescale')}
						</p>
						<p className="break-all text-base font-semibold text-gray-900">
							{replyTo}
						</p>
					</div>

					<div className="min-w-0">
						<p className="mb-1 text-base text-gray-500">
							{__('Subject', 'doublescale')}
						</p>
						<p className="break-words text-base font-semibold text-gray-900">
							{emailSubject}
						</p>
					</div>
				</div>

				<div className="min-w-0">
					<p className="mb-1 text-base text-gray-500">
						{__('Preview Text', 'doublescale')}
					</p>
					<p className="break-words text-base font-semibold text-gray-900">
						{previewText}
					</p>
				</div>
			</>
		);
	};

	return (
		<CardLayout
			icon={<CampaignsIcon />}
			header={__('Campaign Settings', 'doublescale')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit', 'doublescale')}
			onButtonClick={onEdit}
			button={button}
		>
			<div className="min-w-0 space-y-4">
				{renderContent()}
			</div>
		</CardLayout>
	);
};

export default CampaignSettingsCard;
