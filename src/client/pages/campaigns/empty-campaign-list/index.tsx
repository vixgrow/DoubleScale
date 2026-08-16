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
import EmptyCampaignListImage from '@doublescale/assets/images/campaign.png';
import './style.scss';
import { CampaignModalStep } from '@doublescale/client';

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
		email: __('You can Send Basic Email Or Unleash your creativity to build new one by Email Builder!', 'doublescale'),
		sms: __('Compose your SMS message and reach your contacts instantly!', 'doublescale'),
	};
	
	return (
		<div className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-6 max-sm:px-4 max-sm:py-5 sm:px-10 sm:py-28">
			<div className="flex w-full items-center justify-center gap-24 max-sm:gap-0">
				<div className="hidden sm:block">
					<img
						src={EmptyCampaignListImage}
						alt={__('Empty Campaign List', 'doublescale')}
					/>
				</div>
				<div className="w-full max-w-lg rounded-md p-4 max-sm:max-w-full max-sm:p-3 sm:max-w-xl sm:p-0">
					<div className="mb-3 max-sm:mb-2">
						<h2 className="text-2xl font-semibold max-sm:text-lg">
							{
								/* translators: %s: Campaign channel name (Email, SMS, etc.) */
								sprintf(__("Let's Start %s Campaign!", 'doublescale'), channelName)
							}
						</h2>
						<p className="text-base text-gray-400 max-sm:text-sm">
							{__(
								'Start organizing your workspace for stunning design creation.',
								'doublescale'
							)}
						</p>
					</div>
					<ol className="ordered-list max-sm:text-sm">
						<li>
							{__(
								'Click "Create Campaign" and Select one of the campaign types depending on your campaign goals.',
								'doublescale'
							)}
						</li>
						<li>
							{__(
								'Add Your Campaign Settings and information.',
								'doublescale'
							)}
						</li>
						<li>
							{stepThreeContent[campaignChannel] || stepThreeContent.email}
						</li>
					</ol>
					<div className="flex flex-wrap items-center gap-4 max-sm:flex-col max-sm:gap-3 max-sm:[&_button]:w-full">
						<Button onClick={handleCreateClick}>
							{__('Create Campaign', 'doublescale')}
						</Button>
						<Button variant="secondaryDeepBlue">
							<PlayIcon />
							{__('Watch Tutorial', 'doublescale')}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmptyCampaignList;
