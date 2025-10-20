/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { EnvelopeIcon, RepeatIcon, SMSIcon, WhatsAppIcon } from '@/components';
import ArrowRightIcon from '@/components/icons/arrow-right';
import { CampaignModalStep } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

interface CampaignTypesProps {
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	setCampaignType: (type: string) => void;
}

const CampaignTypes: React.FC<CampaignTypesProps> = ({
	step,
	setStep,
	setCampaignType,
}) => {
	const campaignTypesRows = [
		{
			label: __('Email Campaign', 'quillcrm'),
			description: __(
				'Create and send a regular email campaign to your selected subscribers.',
				'quillcrm'
			),
			type: 'standard',
			icon: <EnvelopeIcon />,
		},
		{
			label: __('A/B Split Email', 'quillcrm'),
			description: __(
				'Send two email variations to a sample group and see which performs better.',
				'quillcrm'
			),
			type: 'ab_test',
			icon: <RepeatIcon />,
		},
		{
			label: __('SMS Campaign', 'quillcrm'),
			description: __(
				'Send SMS text messages to your contacts via Twilio.',
				'quillcrm'
			),
			type: CAMPAIGN_CHANNEL.SMS,
			icon: <SMSIcon />,
		},
		{
			label: __('WhatsApp Campaign', 'quillcrm'),
			description: __(
				'Send WhatsApp messages to your contacts via Twilio.',
				'quillcrm'
			),
			type: CAMPAIGN_CHANNEL.WHATSAPP,
			icon: <WhatsAppIcon />,
		},
	];
	return (
		<Dialog
			open={step === 'campaign-types'}
			onOpenChange={() => setStep(null)}
		>
			<DialogContent className="max-w-[840px] w-full mx-auto">
				<DialogHeader>
					<DialogTitle className="text-3xl font-bold mb-1">
						{__('Create Campaign')}
					</DialogTitle>
					<DialogDescription className="text-foreground">
						{__(
							'Select one of the campaign types depending on your campaign goals',
							'quillcrm'
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{campaignTypesRows.map((campaignType) => (
						<div
							className="flex justify-between items-center py-6 px-4 border border-gray-200 rounded-lg cursor-pointer"
							key={campaignType.type}
							onClick={() => {
								setCampaignType(campaignType.type);
								setStep('campaign-name');
							}}
						>
							<div className="flex items-center gap-3">
								<div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-primary-foreground p-3 rounded-xl">
									{campaignType.icon}
								</div>
								<div>
									<p className="font-semibold text-secondary-foreground text-xl mb-1">
										{campaignType.label}
									</p>
									<p className="text-secondary-foreground text-sm">
										{campaignType.description}
									</p>
								</div>
							</div>

							<div>
								<ArrowRightIcon />
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CampaignTypes;
