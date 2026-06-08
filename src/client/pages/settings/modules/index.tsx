import { useState, useCallback, useMemo } from '@wordpress/element';
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
import { Button } from '@/components/ui/button';

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

export default function ModulesSettings() {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [isSaving, setIsSaving] = useState(false);
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

	const isProAddonActive = Boolean(config.getProPluginData()?.is_active);
	const displayRows = useMemo(
		() => buildMarketingModuleDisplayRows(modules, isProAddonActive),
		[modules, isProAddonActive]
	);

	const hasChanges = useMemo(() => Object.keys(pendingChanges).length > 0, [pendingChanges]);

	const handleToggle = useCallback(
		(slug: string, enabled: boolean) => {
			setPendingChanges((prev) => {
				const next = { ...prev, [slug]: enabled };
				return reduceMarketingModulePending(next, modules);
			});
		},
		[modules]
	);

	const handleSave = useCallback(async () => {
		if (!hasChanges) return;
		const payload = pickToggleableModulePayload(pendingChanges, modules);
		if (Object.keys(payload).length === 0) {
			setPendingChanges({});
			createNotice({
				type: 'info',
				message: __(
					'Only modules available in your install can be saved. Install DoubleScale Pro to enable the remaining add-ons.',
					'doublescale'
				),
			});
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
				window.location.reload();
				return;
			}
		} catch (error: any) {
			const msg =
				error?.message ||
				error?.data?.message ||
				__('Failed to save module settings.', 'doublescale');
			createNotice({ type: 'error', message: msg });
		} finally {
			setIsSaving(false);
		}
	}, [hasChanges, pendingChanges, modules, createNotice]);

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-lg font-semibold text-foreground">
					{__('Modules', 'doublescale')}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">
					{__(
						'Enable or disable optional features: SMTP, Pipelines, Forms, Automations, Tasks, Campaigns, Booking, and Support. Other CRM capabilities are always available and are not listed here.',
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
							className={`flex items-center justify-between gap-4 p-4 border rounded-xl transition-colors ${
								mod.unavailableUntilPro
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

			{hasChanges && (
				<div className="flex items-center justify-end p-4 border border-border/40 rounded-xl">
					<Button
						onClick={handleSave}
						disabled={isSaving}
						variant="gradient"
						className="min-w-[120px]"
					>
						{isSaving ? __('Saving...', 'doublescale') : __('Save Changes', 'doublescale')}
					</Button>
				</div>
			)}
		</div>
	);
}
