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

declare const doublescalePro: { isPro?: boolean } | undefined;

interface CampaignTypesProps {
	selectedType: CampaignType;
	onTypeChange: (type: CampaignType) => void;
}

const CampaignTypes: React.FC<CampaignTypesProps> = ({
	selectedType,
	onTypeChange,
}) => {
	const isPro =
		typeof doublescalePro !== 'undefined' && !!doublescalePro?.isPro;

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
			iconPanelClass: 'bg-[#D9E9F3]',
			badgeClass: 'bg-[#D9E9F3] text-[#0D9DFC]',
			requiresPro: false,
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
			iconPanelClass: 'bg-[#FAEADF]',
			badgeClass: 'bg-[#FAEADF] text-[#CB5301]',
			requiresPro: true,
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
					const isLocked = opt.requiresPro && !isPro;
					const isSelected = !isLocked && selectedType === opt.type;
					return (
						<button
							key={opt.type}
							type="button"
							onClick={() => {
								if (!isLocked) {
									onTypeChange(opt.type as CampaignType);
								}
							}}
							disabled={isLocked}
							className={cn(
								'group relative flex w-full items-center rounded-xl border text-left transition-all duration-200',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
								isLocked
									? 'cursor-not-allowed opacity-60 border-border bg-card'
									: 'hover:border-primary/35 hover:shadow-md',
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
										{isLocked && (
											<span className="ml-2 inline-flex items-center rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
												PRO
											</span>
										)}
									</p>
									<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
										{isLocked
											? __(
													'Upgrade to DoubleScale Pro to unlock automated campaigns triggered by content events or recurring schedules.',
													'doublescale'
												)
											: opt.description}
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
