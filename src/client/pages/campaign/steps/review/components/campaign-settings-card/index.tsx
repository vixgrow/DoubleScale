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
	fromPhone?: string;
	replyTo?: string;
	emailSubject?: string;
	previewText?: string;
	onEdit?: () => void;
	button?: boolean;
}

const CampaignSettingsCard: React.FC<CampaignSettingsCardProps> = ({
	campaignType = 'email',
	fromName,
	fromEmail,
	fromPhone,
	replyTo,
	emailSubject,
	previewText,
	onEdit,
	button = true,
}) => {
	const isSMS = campaignType === 'sms';

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
				{isSMS ? (
					// SMS Layout - Only From Name and Phone
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
								{__('Phone', 'quillcrm')}
							</p>
							<p className="text-base font-semibold text-gray-900">
								{fromPhone || '-'}
							</p>
						</div>
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
