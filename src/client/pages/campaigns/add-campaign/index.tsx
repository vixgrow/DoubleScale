/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import CampaignTypes from './campaign-types';
import CampaignName from './campaign-name';
import { CampaignModalStep } from '@quillcrm/client';

interface AddCampaignProps {
	setCampaignType: (campaignType: string) => void;
	campaignType: string;
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	addCampaign: (campaignName: string) => void;
}

const AddCampaign: React.FC<AddCampaignProps> = ({
	setCampaignType,
	step,
	setStep,
	addCampaign,
}) => {
	return (
		<>
			{step === 'campaign-types' && (
				<CampaignTypes
					step={step}
					setStep={setStep}
					setCampaignType={setCampaignType}
				/>
			)}

			{step === 'campaign-name' && (
				<CampaignName
					step={step}
					setStep={setStep}
					addCampaign={addCampaign}
				/>
			)}
		</>
	);
};

export default AddCampaign;
