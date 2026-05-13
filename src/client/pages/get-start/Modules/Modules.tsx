import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
import {
	buildMarketingModuleDisplayRows,
	getEffectiveMarketingModuleState,
	OPTIONAL_MARKETING_MODULE_SLUGS,
	pickToggleableModulePayload,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
	AutomationsIcon,
	BookingIcon,
	CampaignIcon,
	FormsIcon,
	IntegrationsIcon,
	PipelineIcon,
	TaskIcon,
} from '@doublescale/components';

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

interface ModulesStepProps {
	readonly onNext: () => void;
	readonly onPrevious: () => void;
	readonly onSkip: () => void;
}

function getModuleIcon(slug: string) {
	switch (slug) {
		case 'smtp':
		case 'email':
			return <IntegrationsIcon width={32} height={32} color="#0D9DFC" />;
		case 'deals':
		case 'pipelines':
			return <PipelineIcon width={32} height={32} color="#0D9DFC" />;
		case 'forms':
			return <FormsIcon width={32} height={32} color="#0D9DFC" />;
		case 'automations':
			return <AutomationsIcon width={32} height={32} color="#0D9DFC" />;
		case 'tasks':
			return <TaskIcon width={32} height={32} color="#0D9DFC" />;
		case 'campaigns':
			return <CampaignIcon width={32} height={32} color="#0D9DFC" />;
		case 'booking':
			return <BookingIcon width={32} height={32} color="#0D9DFC" />;


		default:
			return <IntegrationsIcon width={32} height={32} color="#0D9DFC" />;
	}
}

export default function ModulesStep({ onNext, onPrevious, onSkip: _onSkip }: ModulesStepProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>(() => {
		const apiModules = config.getModules();
		const allOn: Record<string, boolean> = {};
		for (const slug of OPTIONAL_MARKETING_MODULE_SLUGS) {
			allOn[slug] = true;
		}
		return reduceMarketingModulePending(allOn, apiModules);
	});
	const [isSaving, setIsSaving] = useState(false);

	const displayRows = useMemo(() => buildMarketingModuleDisplayRows(modules), [modules]);

	const handleToggle = useCallback(
		(slug: string, enabled: boolean) => {
			setPendingChanges((prev) => {
				const next = { ...prev, [slug]: enabled };
				return reduceMarketingModulePending(next, modules);
			});
		},
		[modules]
	);

	const handleNext = useCallback(async () => {
		if (Object.keys(pendingChanges).length === 0) {
			onNext();
			return;
		}

		const payload = pickToggleableModulePayload(pendingChanges, modules);
		if (Object.keys(payload).length === 0) {
			setPendingChanges({});
			onNext();
			return;
		}

		setIsSaving(true);
		try {
			const response = await apiFetch<ModulesResponse>({
				path: '/doublescale/v1/modules',
				method: 'POST',
				data: { modules: payload },
			});

			if (response.success) {
				setModules(response.modules);
				config.setModules(response.modules);
				setPendingChanges({});
			}

			onNext();
		} catch (error: unknown) {
			const err = error as { message?: string; data?: { message?: string } };
			const msg =
				err?.message ||
				err?.data?.message ||
				__('Failed to save module settings.', 'doublescale');
			createNotice({ type: 'error', message: msg });
		} finally {
			setIsSaving(false);
		}
	}, [pendingChanges, onNext, createNotice]);

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
						const isEnabled = getEffectiveMarketingModuleState(mod, modules, pendingChanges);
						const requires = mod.dependencies?.length ? mod.dependencies.join(', ') : null;

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
							</div>
						);
					})}
				</div>
			</div>
			<div className="z-20 -mx-6 -mb-6  shrink-0  bg-white px-6 py-4 mt-6 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex items-center justify-end gap-6">
					<Button type="button" size="lg" variant="secondaryDeepBlue" onClick={onPrevious}>
						{__('Back', 'doublescale')}
					</Button>
					<Button type="button" size="lg" variant="default" onClick={handleNext} disabled={isSaving}>
						{isSaving ? __('Saving...', 'doublescale') : __('Next Step', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
