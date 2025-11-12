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
	onEdit?: () => void;
}

const CampaignSettingsCard: React.FC<CampaignSettingsCardProps> = ({
	campaignType = 'email',
	fromName,
	fromEmail,
	replyTo,
	emailSubject,
	previewText,
	onEdit,
}) => {
	const isSMS = campaignType === 'sms';

	return (
		<CardLayout
			icon={<CampaignsIcon />}
			header={__('Campaign Settings', 'quillcrm')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit', 'quillcrm')}
			onButtonClick={onEdit}
		>
			<div className="space-y-4">
				{isSMS ? (
					// SMS Layout - No sender fields (uses global Twilio phone number)
					<div className="text-center py-4">
						<p className="text-base text-gray-500">
							{__('SMS campaigns use the phone number configured in Twilio integration settings.', 'quillcrm')}
						</p>
					</div>
				) : (
					// Email Layout - All fields
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
				)}
			</div>
		</CardLayout>
	);
};

export default CampaignSettingsCard;
