/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { PlayIcon } from '@/components';
// @ts-ignore
import EmptyCampaignListImage from '@quillcrm/assets/images/campaign.png';
import './style.scss';
import { CampaignModalStep } from '@quillcrm/client';

interface EmptyCampaignListProps {
	setStep: (step: CampaignModalStep) => void;
	campaignChannel?: string;
	onCreateClick?: () => void; // Optional custom handler for create button
}

const EmptyCampaignList: React.FC<EmptyCampaignListProps> = ({
	setStep,
	campaignChannel = 'email',
	onCreateClick
}) => {
	// Capitalize first letter for display
	const channelName = campaignChannel.charAt(0).toUpperCase() + campaignChannel.slice(1);

	// Handle create button click
	const handleCreateClick = () => {
		if (onCreateClick) {
			onCreateClick();
		} else {
			setStep('campaign-types');
		}
	};
	
	const stepThreeContent = {
		email: __('You can Send Basic Email Or Unleash your creativity to build new one by Email Builder!', 'quillcrm'),
		sms: __('Compose your SMS message and reach your contacts instantly!', 'quillcrm'),
	};
	
	return (
		<div className="flex items-center justify-center border border-gray-200 rounded-lg py-28 px-10">
			<div className="flex items-center justify-center gap-24">
				<div>
					<img
						src={EmptyCampaignListImage}
						alt="Empty Campaign List"
					/>
				</div>
				<div className="w-full max-w-xl">
					<div className="mb-3">
						<h2 className="text-2xl font-semibold">
							{
								/* translators: %s: Campaign channel name (Email, SMS, etc.) */
								sprintf(__("Let's Start %s Campaign!", 'quillcrm'), channelName)
							}
						</h2>
						<p className="text-base text-gray-400">
							{__(
								'Start organizing your workspace for stunning design creation.',
								'quillcrm'
							)}
						</p>
					</div>
					<ol className="ordered-list">
						<li>
							{__(
								'Click "Create Campaign" and Select one of the campaign types depending on your campaign goals.',
								'quillcrm'
							)}
						</li>
						<li>
							{__(
								'Add Your Campaign Settings and information.',
								'quillcrm'
							)}
						</li>
						<li>
							{stepThreeContent[campaignChannel] || stepThreeContent.email}
						</li>
					</ol>
					<div className="flex gap-4 items-center">
						<Button onClick={handleCreateClick}>
							{__('Create Campaign', 'quillcrm')}
						</Button>
						<Button variant="secondaryDeepBlue">
							<PlayIcon />
							{__('Watch Tutorial', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmptyCampaignList;
