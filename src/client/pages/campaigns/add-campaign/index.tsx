/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import CampaignTypes from './campaign-types';
import { CampaignModalStep, CampaignType } from '@quillcrm/client';

interface AddCampaignProps {
	setCampaignType: (campaignType: CampaignType) => void;
	campaignType: CampaignType;
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
					addCampaign={addCampaign}
				/>
			)}
		</>
	);
};

export default AddCampaign;
