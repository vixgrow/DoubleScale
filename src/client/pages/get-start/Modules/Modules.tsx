import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import {
	buildChildModuleRows,
	buildMarketingModuleDisplayRows,
	getChildModuleToggleState,
	getEffectiveMarketingModuleState,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
	AutomationsIcon,
	BookingIcon,
	CampaignIcon,
	FormsIcon,
	HelpdeskIcon,
	IntegrationsIcon,
	PipelineIcon,
	ProjectsIcon,
	SalesIcon,
	SmtpIcon,
	TaskIcon,
} from '@doublescale/components';

interface ModulesStepProps {
	readonly onNext: () => void;
	readonly onPrevious: () => void;
	readonly onSkip: () => void;
	readonly pendingModuleChanges: Record<string, boolean>;
	readonly onPendingModuleChange: (next: Record<string, boolean>) => void;
}

function getModuleIcon(slug: string) {
	switch (slug) {
		case 'smtp':
		case 'email':
			return <SmtpIcon width={32} height={32} color="#0D9DFC" />;
		case 'deals':
		case 'pipelines':
			return <PipelineIcon width={32} height={32} color="#0D9DFC" />;
		case 'sales':
			return <SalesIcon width={32} height={32} color="#0D9DFC" />;
		case 'forms':
			return <FormsIcon width={32} height={32} color="#0D9DFC" />;
		case 'automations':
			return <AutomationsIcon width={32} height={32} color="#0D9DFC" />;
		case 'tasks':
			return <TaskIcon width={32} height={32} color="#0D9DFC" />;
		case 'projects':
			return <ProjectsIcon width={32} height={32} color="#0D9DFC" />;
		case 'campaigns':
			return <CampaignIcon width={32} height={32} color="#0D9DFC" />;
		case 'booking':
			return <BookingIcon width={32} height={32} color="#0D9DFC" />;
		case 'support':
			return <HelpdeskIcon width={32} height={32} color="#0D9DFC" />;

		default:
			return <IntegrationsIcon width={32} height={32} color="#0D9DFC" />;
	}
}

export default function ModulesStep({
	onNext,
	onPrevious,
	onSkip: _onSkip,
	pendingModuleChanges,
	onPendingModuleChange,
}: ModulesStepProps) {
	const modules = useMemo(() => config.getModules(), []);
	const isProAddonActive = isProActive();
	const displayRows = useMemo(
		() => buildMarketingModuleDisplayRows(modules, isProAddonActive),
		[modules, isProAddonActive]
	);

	const handleToggle = useCallback(
		(slug: string, enabled: boolean) => {
			const next = { ...pendingModuleChanges, [slug]: enabled };
			onPendingModuleChange(reduceMarketingModulePending(next, modules));
		},
		[pendingModuleChanges, onPendingModuleChange, modules]
	);

	const handleNext = useCallback(() => {
		// Selections are staged in the parent wizard's state. Migrations and
		// the REST commit happen once at EndStep so the user can revisit this
		// step and revise choices without thrashing the DB.
		onNext();
	}, [onNext]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="shrink-0 pb-6">
				<h3 className="text-foreground text-2xl font-bold leading-9 mb-2.5">
					{__('Select Modules', 'doublescale')}
				</h3>
				<p className="text-muted-foreground text-base leading-7 font-medium">
					{__(
						'Enable or disable modules to customize your project. Disabled modules will not load, freeing up resources.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6">
					{displayRows.map((mod) => {
						const isEnabled = getEffectiveMarketingModuleState(mod, modules, pendingModuleChanges);
						const requires = mod.dependencies?.length ? mod.dependencies.join(', ') : null;
						const childRows = buildChildModuleRows(mod.slug, modules, isProAddonActive);

						return (
							<div
								key={mod.slug}
								className="flex flex-col gap-2 rounded-xl border border-border bg-white p-6 transition-colors"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex min-w-0 items-center gap-2.5">
										<span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#D9E9F3] p-1 text-[#0D9DFC]">
											{getModuleIcon(mod.slug)}
										</span>
										<span className="truncate text-lg font-semibold leading-[30px] text-foreground">
											{mod.label}
										</span>
									</div>
									<Switch
										checked={isEnabled}
										onCheckedChange={(checked) => handleToggle(mod.slug, checked)}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<p className="text-base leading-7 text-muted-foreground">{mod.description}</p>
									{requires && (
										<p className="text-sm font-medium leading-4 text-[#CB5301]">
											{__('Requires:', 'doublescale')} {requires}
										</p>
									)}
									{mod.unavailableUntilPro && (
										<p className="text-sm leading-4 text-muted-foreground">
											{__(
												'Install and activate DoubleScale Pro to enable and use this module.',
												'doublescale'
											)}{' '}
											<a
												className="font-medium text-primary underline"
												href={config.getUrlDoubleScalePro()}
												target="_blank"
												rel="noopener noreferrer"
											>
												{__('View Pro plans', 'doublescale')}
											</a>
										</p>
									)}
									{mod.slug === 'smtp' && !isEnabled && !mod.unavailableUntilPro && (
										<p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
											{__(
												'SMTP is important for sending emails and campaigns. Disabling it may prevent emails from being delivered.',
												'doublescale'
											)}
										</p>
									)}
								</div>
								{childRows.map((child) => {
									const childChecked = getChildModuleToggleState(
										child,
										pendingModuleChanges
									);

									return (
										<div
											key={child.slug}
											className={`ml-3 mt-1 flex items-center justify-between gap-3 border-l-2 pl-3 ${
												isEnabled ? 'border-border' : 'border-border/40 opacity-60'
											}`}
										>
											<div className="flex min-w-0 flex-col gap-0.5">
												<span className="text-base font-semibold leading-6 text-foreground">
													{child.label}
												</span>
												<p className="text-sm leading-5 text-muted-foreground">
													{child.description}
												</p>
												{isEnabled && child.unavailableUntilPro && (
													<p className="text-sm leading-4 text-muted-foreground">
														{__(
															'Install and activate DoubleScale Pro to enable and use this module.',
															'doublescale'
														)}
													</p>
												)}
											</div>
											<Switch
												checked={childChecked}
												disabled={!isEnabled}
												onCheckedChange={(checked) =>
													handleToggle(child.slug, checked)
												}
											/>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
			<div className="z-20 -mx-6 -mb-6  shrink-0  bg-white px-6 py-4 mt-6 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex items-center justify-between gap-3 lg:justify-end  sm:gap-6">
					<Button type="button" size="lg" variant="secondaryDeepBlue" onClick={onPrevious}>
						{__('Back', 'doublescale')}
					</Button>
					<Button type="button" size="lg" variant="default" onClick={handleNext}>
						{__('Next Step', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
