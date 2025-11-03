/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardLayout from '../card-layout';
import { CampaignsIcon } from '@quillcrm/components';
import { EditIcon } from 'lucide-react';

interface CampaignSettingsCardProps {
	fromName: string;
	fromEmail: string;
	replyTo: string;
	emailSubject: string;
	previewText: string;
	onEdit?: () => void;
}

const CampaignSettingsCard: React.FC<CampaignSettingsCardProps> = ({
	fromName,
	fromEmail,
	replyTo,
	emailSubject,
	previewText,
	onEdit,
}) => {
	return (
		<CardLayout
			icon={<CampaignsIcon />}
			header={__('Campaign Settings', 'quillcrm')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit', 'quillcrm')}
			onButtonClick={onEdit}
		>
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-2">
					<div>
						<p className="text-xs text-gray-500 mb-1">
							{__('From Name', 'quillcrm')}
						</p>
						<p className="text-sm font-medium text-gray-900">
							{fromName}
						</p>
					</div>
					<div>
						<p className="text-xs text-gray-500 mb-1">
							{__('From Email', 'quillcrm')}
						</p>
						<p className="text-sm font-medium text-gray-900">
							{fromEmail}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div>
						<p className="text-xs text-gray-500 mb-1">
							{__('Reply to', 'quillcrm')}
						</p>
						<p className="text-sm font-medium text-gray-900">
							{replyTo}
						</p>
					</div>

					<div>
						<p className="text-xs text-gray-500 mb-1">
							{__('Subject', 'quillcrm')}
						</p>
						<p className="text-sm font-medium text-gray-900">
							{emailSubject}
						</p>
					</div>
				</div>

				<div>
					<p className="text-xs text-gray-500 mb-1">
						{__('Preview Text', 'quillcrm')}
					</p>
					<p className="text-sm text-gray-900">{previewText}</p>
				</div>
			</div>
		</CardLayout>
	);
};

export default CampaignSettingsCard;
