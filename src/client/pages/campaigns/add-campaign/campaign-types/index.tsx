/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { CheckIcon } from '@doublescale/components';
import { CampaignType } from '@doublescale/client';
import { cn } from '@/lib/utils';
//@ts-ignore asset lives under plugin root (outside ts rootDir)
import standardCampaignImg from '../../../../../../assets/images/standard-campaign.png';
//@ts-ignore asset lives under plugin root (outside ts rootDir)
import automatedCampaignImg from '../../../../../../assets/images/automated-campaign.png';

interface CampaignTypesProps {
	selectedType: CampaignType;
	onTypeChange: (type: CampaignType) => void;
}

const CampaignTypes: React.FC<CampaignTypesProps> = ({
	selectedType,
	onTypeChange,
}) => {
	const options = [
		{
			label: __('Standard', 'doublescale'),
			hint: __('Broadcast', 'doublescale'),
			description: __(
				'Send a one-time message to a segmented list—ideal for newsletters and promotions.',
				'doublescale'
			),
			type: 'standard' as const,
			image: standardCampaignImg,
			iconPanelClass:
				'bg-[#D9E9F3]',
			badgeClass:
				'bg-[#D9E9F3] text-[#0D9DFC]',
		},
		{
			label: __('Automated', 'doublescale'),
			hint: __('Triggered', 'doublescale'),
			description: __(
				'Runs when triggered by a WordPress content event or recurring schedule, not manual one-time send.',
				'doublescale'
			),
			type: 'automated' as const,
			image: automatedCampaignImg,
			iconPanelClass:
				'bg-[#FAEADF]',
			badgeClass:
				'bg-[#FAEADF] text-[#CB5301]',
		},
	];

	return (
		<div className="space-y-4">
			<div>
				<p className="text-base leading-relaxed text-[#29292E]">
					{__(
						'Choose how this campaign should run. You can change details later in the editor.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="flex flex-col gap-6">
				{options.map((opt) => {
					const isSelected = selectedType === opt.type;
					return (
						<button
							key={opt.type}
							type="button"
							onClick={() =>
								onTypeChange(opt.type as CampaignType)
							}
							className={cn(
								'group relative flex w-full items-center rounded-xl border text-left transition-all duration-200',
								'hover:border-primary/35 hover:shadow-md',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
								isSelected
									? 'border-primary bg-white ring-1 ring-primary'
									: 'border-border bg-card'
							)}
						>
							{isSelected && (
								<span
									className="pointer-events-none absolute -right-2 -top-2 z-10 bg-white rounded-full p-0"
									aria-hidden
								>
									<CheckIcon width={22} height={22} />
								</span>
							)}

							<div
								className={cn(
									'flex shrink-0 items-center justify-center rounded-l-xl p-6',
									opt.iconPanelClass
								)}
							>
								<img
									src={opt.image}
									alt={opt.label}
									className="h-16 w-16 object-contain"
								/>
							</div>

							<div className="flex min-w-0 flex-1 items-start gap-4 rounded-r-xl pl-3 pr-4 py-4">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold tracking-tight text-foreground">
										{opt.label}
									</p>
									<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
										{opt.description}
									</p>
								</div>

								<span
									className={cn(
										'shrink-0 rounded-lg p-1 text-sm font-medium tracking-wide',
										opt.badgeClass
									)}
								>
									{opt.hint}
								</span>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default CampaignTypes;
