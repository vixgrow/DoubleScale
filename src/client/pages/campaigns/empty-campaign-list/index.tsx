/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
}

const EmptyCampaignList: React.FC<EmptyCampaignListProps> = ({ setStep }) => {
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
							{__("Let's Start Email Campaign!", 'quillcrm')}
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
							{__(
								'You can Send Basic Email Or Unleash your creativity to build new one by Email Builder!',
								'quillcrm'
							)}
						</li>
					</ol>
					<div className="flex gap-4 items-center">
						<Button onClick={() => setStep('campaign-types')}>
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
