/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from 'react';

/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
} from '@/components/ui/dialog';
import { CampaignsIcon, CustomDialogHeader, Field, GradientCampaignsIcon, NoticeBanner } from '@/components';
import { Button } from '@/components/ui/button';
import CampaignTypes from './campaign-types';
import { CampaignModalStep, CampaignType, NoticeMessage } from '@quillcrm/client';

interface AddCampaignProps {
	setCampaignType: (campaignType: CampaignType) => void;
	campaignType: CampaignType;
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	addCampaign: (campaignName: string) => Promise<{ success: boolean; error?: string }>;
	activeTab: string;
}

const AddCampaign: React.FC<AddCampaignProps> = ({
	setCampaignType,
	step,
	setStep,
	addCampaign,
	activeTab,
}) => {
	const [campaignName, setCampaignName] = useState('');
	const [selectedType, setSelectedType] = useState<CampaignType>('standard');
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const handleSubmit = async () => {
		if (!campaignName.trim()) {
			setNotice({
				type: 'error',
				message: __('Campaign name is required', 'quillcrm'),
			});
			return;
		}
		
		// Set campaign type for email campaigns
		if (activeTab === 'email') {
			setCampaignType(selectedType);
		}
		
		const result = await addCampaign(campaignName);
		if (!result.success && result.error) {
			setNotice({
				type: 'error',
				message: result.error,
			});
		} else {
			setStep(null);
			setCampaignName('');
			setNotice(null);
		}
	};

	const handleOpenChange = () => {
		setStep(null);
		setCampaignName('');
		setNotice(null);
	};

	return (
		<Dialog
			open={step === 'campaign-types'}
			onOpenChange={handleOpenChange}
		>
			<DialogContent className="max-w-[740px] w-full mx-auto">
				<CustomDialogHeader
					title={__('Create Campaign', 'quillcrm')}
					subtitle={__(
						"Name your campaign to help you remember what it's about. only you will see this.",
						'quillcrm'
					)}
					icon={<GradientCampaignsIcon />}
				/>

				{/* Notice Banner */}
				{notice && (
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				)}

				{/* Campaign Name Input */}
				<div>
					<Field
						label={__('Campaign Name', 'quillcrm')}
						type="text"
						placeholder={__('Enter Campaign Name', 'quillcrm')}
						value={campaignName}
						onChange={(value) => setCampaignName(value)}
						required={true}
					/>
				</div>

				{/* Email: Show campaign type selection */}
				{activeTab === 'email' && (
					<CampaignTypes
						selectedType={selectedType}
						onTypeChange={setSelectedType}
					/>
				)}

				{/* Submit button - shared by all campaign types */}
				<Button
					variant="gradient"
					size="xl"
					onClick={handleSubmit}
					disabled={!campaignName.trim()}
					className="w-full"
				>
					{__('Create Campaign', 'quillcrm')}
				</Button>
			</DialogContent>
		</Dialog>
	);
};

export default AddCampaign;
