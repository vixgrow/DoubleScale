import { useState, useCallback, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
import {
	buildMarketingModuleDisplayRows,
	getEffectiveMarketingModuleState,
	pickToggleableModulePayload,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import ButtonComponent from '../component/button';

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

interface ModulesStepProps {
	readonly onNext: () => void;
	readonly onPrevious: () => void;
	readonly onSkip: () => void;
}

export default function ModulesStep({ onNext, onPrevious, onSkip }: ModulesStepProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
	const [isSaving, setIsSaving] = useState(false);

	const displayRows = useMemo(() => buildMarketingModuleDisplayRows(modules), [modules]);

	useEffect(() => {
		const TARGETS = ['smtp', 'deals', 'forms', 'tasks', 'campaigns', 'booking'];
		const pending: Record<string, boolean> = {};
		for (const slug of TARGETS) {
			const m = modules.find((x) => x.slug === slug);
			if (m && m.is_toggleable && !m.enabled) pending[slug] = true;
		}
		if (Object.keys(pending).length > 0) {
			setPendingChanges((prev) => ({ ...pending, ...prev }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-foreground text-2xl font-semibold mb-1">
					{__('Choose Your Modules', 'doublescale')}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						'Turn on only the add-ons you want: SMTP, Pipelines, Forms, Tasks, Campaigns, and Booking. Everything else in the CRM stays available and is not listed here. You can change this later in Settings → Modules.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{displayRows.map((mod) => {
					const isEnabled = getEffectiveMarketingModuleState(mod, modules, pendingChanges);

					return (
						<div
							key={mod.slug}
							className={`flex items-center justify-between gap-4 p-4 border rounded-xl transition-colors ${mod.unavailableUntilPro
									? 'border-border/40 bg-muted/15'
									: isEnabled
										? 'border-border/60 bg-card'
										: 'border-border/40 bg-muted/20'
								}`}
						>
							<div className="flex flex-col gap-1 flex-1 min-w-0">
								<span
									className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
								>
									{mod.label}
								</span>
								<p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
								{mod.unavailableUntilPro && (
									<p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
										{__(
											'Install and activate DoubleScale Pro to enable and use this module.',
											'doublescale'
										)}{' '}
										<a
											className="text-primary underline font-medium"
											href={config.getUrlDoubleScalePro()}
											target="_blank"
											rel="noopener noreferrer"
										>
											{__('View Pro plans', 'doublescale')}
										</a>
									</p>
								)}
								{mod.slug === 'smtp' && !isEnabled && !mod.unavailableUntilPro && (
									<p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
										{__(
											'SMTP is important for sending emails and campaigns. Disabling it may prevent emails from being delivered.',
											'doublescale'
										)}
									</p>
								)}
							</div>
							<Switch
								checked={isEnabled}
								onCheckedChange={(checked) => handleToggle(mod.slug, checked)}
							/>
						</div>
					);
				})}
			</div>

			<div className="flex justify-between pt-6">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						{__('Previous', 'doublescale')}
					</ButtonComponent>
					<ButtonComponent type="no" onClick={onSkip}>
						{__('Skip', 'doublescale')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={handleNext} disabled={isSaving}>
					{isSaving ? __('Saving...', 'doublescale') : __('Next Step', 'doublescale')}
				</ButtonComponent>
			</div>
		</div>
	);
}
