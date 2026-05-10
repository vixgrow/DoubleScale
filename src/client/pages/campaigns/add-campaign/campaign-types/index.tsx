/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';
import { Check } from 'lucide-react';

/**
 * internal dependencies
 */
import { AllContactsIcon, RepeatIcon } from '@doublescale/components';
import { CampaignType } from '@doublescale/client';
import { cn } from '@/lib/utils';

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
			icon: <AllContactsIcon width={22} height={22} />,
		},
		{
			label: __('Automated', 'doublescale'),
			hint: __('Triggered', 'doublescale'),
			description: __(
				'Runs when you activate it using a WordPress content event (for example, when a post is published) or on a recurring schedule—not a manual one-time send.',
				'doublescale'
			),
			type: 'automated' as const,
			icon: <RepeatIcon width={22} height={22} />,
		},
	];

	return (
		<div className="space-y-4">
			<div>
				<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
					{__('Campaign type', 'doublescale')}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{__(
						'Choose how this campaign should run. You can change details later in the editor.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{options.map((opt) => {
					const isSelected = selectedType === opt.type;
					return (
						<button
							key={opt.type}
							type="button"
							onClick={() => onTypeChange(opt.type)}
							className={cn(
								'group relative flex flex-col rounded-xl border bg-card p-5 text-left transition-all duration-200',
								'hover:border-primary/35 hover:shadow-sm',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2',
								isSelected
									? 'border-primary shadow-md ring-1 ring-primary/15 bg-primary/[0.06]'
									: 'border-border/80'
							)}
						>
							<span
								className={cn(
									'absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
									isSelected
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-muted-foreground/25 bg-background text-transparent'
								)}
								aria-hidden
							>
								<Check className="h-3.5 w-3.5 stroke-[3]" />
							</span>

							<span
								className={cn(
									'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors',
									isSelected
										? 'border-primary/20 bg-primary/10 text-primary'
										: 'border-border/60 bg-muted/40 text-foreground'
								)}
							>
								{opt.icon}
							</span>

							<div className="flex flex-wrap items-baseline gap-2 pr-10">
								<span className="text-base font-semibold tracking-tight text-foreground">
									{opt.label}
								</span>
								<span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									{opt.hint}
								</span>
							</div>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{opt.description}
							</p>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default CampaignTypes;
