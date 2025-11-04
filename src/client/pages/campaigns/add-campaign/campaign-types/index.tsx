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
import {
	ABTestIcon,
	CampaignsIcon,
	EmailOutlinedIcon,
	EmailSequenceOutlinedIcon,
	PremiumIcon,
} from '@/components';
import { CampaignModalStep, CampaignType } from '@quillcrm/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CampaignTypesProps {
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	setCampaignType: (type: CampaignType) => void;
	addCampaign: (campaignName: string) => void;
}

const CampaignTypes: React.FC<CampaignTypesProps> = ({
	step,
	setStep,
	setCampaignType,
	addCampaign,
}) => {
	const [campaignName, setCampaignName] = useState('');
	const [selectedType, setSelectedType] = useState<CampaignType>('standard');

	const campaignTypesRows = [
		{
			label: __('Standard Campaign', 'quillcrm'),
			description: __(
				'One-time mass email sent to a large, segmented list.',
				'quillcrm'
			),
			type: 'standard',
			icon: <EmailOutlinedIcon />,
		},
		{
			label: __('A/B Split Campaign', 'quillcrm'),
			description: __(
				'Split audience to test one variable; send winner to the rest.',
				'quillcrm'
			),
			type: 'ab_test',
			icon: <ABTestIcon />,
			isPremium: true,
		},
		// {
		// 	label: __('Email Sequence', 'quillcrm'),
		// 	description: __(
		// 		'Slow, personalized follow-up series; stops automatically on reply',
		// 		'quillcrm'
		// 	),
		// 	type: 'sequence',
		// 	icon: <EmailSequenceOutlinedIcon />,
		// },
	];

	const handleSubmit = () => {
		if (!campaignName.trim()) {
			return;
		}
		setCampaignType(selectedType);
		setStep(null);
		addCampaign(campaignName);
	};
	return (
		<Dialog
			open={step === 'campaign-types'}
			onOpenChange={() => setStep(null)}
		>
			<DialogContent className="max-w-[740px] w-full mx-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold mb-1 flex items-center gap-2">
						<div className=" text-primary icon p-2 rounded-xl bg-[#4A30CF1F]">
							<CampaignsIcon />
						</div>
						{__('Create Campaign', 'quillcrm')}
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						{__(
							"Name your campaign to help you remember what it's about. only you will see this.",
							'quillcrm'
						)}
					</DialogDescription>
				</DialogHeader>

				{/* Campaign Name Input */}
				<div className="grid gap-2 border-b border-gray-200 pb-5">
					<Label
						htmlFor="campaign-name"
						className="text-sm font-medium"
					>
						{__('Campaign Name', 'quillcrm')}
						<span className="text-red-500">*</span>
					</Label>
					<Input
						id="campaign-name"
						name="campaign-name"
						placeholder={__('Campaign Name', 'quillcrm')}
						value={campaignName}
						onChange={(e) => setCampaignName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSubmit();
							}
						}}
					/>
				</div>

				{/* Campaign Type Selection */}
				<div className="grid gap-2">
					<Label className="text-sm font-medium">
						{__('Select a campaign type', 'quillcrm')}
					</Label>
					<div className="flex flex-col gap-3">
						{campaignTypesRows.map((campaignType) => (
							<div
								key={campaignType.type}
								className={`flex items-center justify-between px-4 py-6 border rounded-xl cursor-pointer transition-colors relative overflow-hidden ${
									selectedType === campaignType.type
										? 'border-primary bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'
								}`}
								onClick={() =>
									setSelectedType(
										campaignType.type as CampaignType
									)
								}
							>
								<div className="flex items-center gap-3 flex-1">
									<div
										className="text-primary-foreground p-2.5 rounded-xl"
										style={{
											background:
												'var(--Linear, linear-gradient(90deg, #1E3A8A 61.06%, #3B82F6 100%))',
										}}
									>
										{campaignType.icon}
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<p className="font-semibold text-secondary-foreground text-base">
												{campaignType.label}
											</p>
											{campaignType.isPremium && (
												<span className="bg-orange-50 text-[#CB5301] text-base px-2 py-0.5 rounded-md flex items-center gap-1 absolute right-0 top-0">
													<PremiumIcon />
													{__('Premium', 'quillcrm')}
												</span>
											)}
										</div>
										<p className="text-muted-foreground text-sm">
											{campaignType.description}
										</p>
									</div>
								</div>
								<div>
									<div
										className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
											selectedType === campaignType.type
												? 'border-primary bg-primary'
												: 'border-gray-300'
										}`}
									>
										{selectedType === campaignType.type && (
											<div className="w-2 h-2 bg-white rounded-full" />
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Create Campaign Button */}
				<Button
					variant="gradient"
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

export default CampaignTypes;
