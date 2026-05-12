import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

function getEffectiveState(
	slug: string,
	modules: ModuleInfo[],
	pending: Record<string, boolean>
): boolean {
	if (pending[slug] !== undefined) return pending[slug];
	const mod = modules.find((m) => m.slug === slug);
	return mod ? mod.enabled : true;
}

/** Matches Get Started: SMTP, Pipelines, Forms, Tasks, Campaigns, Booking. */
const OPTIONAL_MODULE_DISPLAY_ORDER = [
	'smtp',
	'deals',
	'forms',
	'tasks',
	'campaigns',
	'booking',
];

function sortToggleableModules(list: ModuleInfo[]): ModuleInfo[] {
	return [...list].sort((a, b) => {
		const ia = OPTIONAL_MODULE_DISPLAY_ORDER.indexOf(a.slug);
		const ib = OPTIONAL_MODULE_DISPLAY_ORDER.indexOf(b.slug);
		if (ia === -1 && ib === -1) {
			return a.label.localeCompare(b.label);
		}
		if (ia === -1) {
			return 1;
		}
		if (ib === -1) {
			return -1;
		}
		return ia - ib;
	});
}

export default function ModulesSettings() {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [isSaving, setIsSaving] = useState(false);
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

	const hasChanges = useMemo(() => Object.keys(pendingChanges).length > 0, [pendingChanges]);

	const handleToggle = useCallback(
		(slug: string, enabled: boolean) => {
			setPendingChanges((prev) => {
				const next = { ...prev, [slug]: enabled };

				const cleaned: Record<string, boolean> = {};
				for (const [s, v] of Object.entries(next)) {
					const original = modules.find((m) => m.slug === s);
					if (original && original.enabled !== v) {
						cleaned[s] = v;
					}
				}
				return cleaned;
			});
		},
		[modules]
	);

	const handleSave = useCallback(async () => {
		if (!hasChanges) return;
		setIsSaving(true);
		try {
			const response = await apiFetch<ModulesResponse>({
				path: '/doublescale/v1/modules',
				method: 'POST',
				data: { modules: pendingChanges },
			});

			if (response.success) {
				setModules(response.modules);
				config.setModules(response.modules);
				setPendingChanges({});
				createNotice({
					type: 'success',
					message: __('Module settings saved. Reload the page for changes to take full effect.', 'doublescale'),
				});
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
	}, [hasChanges, pendingChanges, createNotice]);

	const optionalShown = useMemo(
		() =>
			sortToggleableModules(
				modules.filter(
					(m) => m.is_toggleable && OPTIONAL_MODULE_DISPLAY_ORDER.includes(m.slug)
				)
			),
		[modules]
	);

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-lg font-semibold text-foreground">
					{__('Modules', 'doublescale')}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">
					{__(
						'Enable or disable optional features: SMTP, Pipelines, Forms, Tasks, Campaigns, and Booking. Other CRM capabilities are always available and are not listed here.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{optionalShown.map((mod) => {
					const isEnabled = getEffectiveState(mod.slug, modules, pendingChanges);

					return (
						<div
							key={mod.slug}
							className={`flex items-center justify-between gap-4 p-4 border rounded-xl transition-colors ${
								isEnabled
									? 'border-border/60 bg-card'
									: 'border-border/40 bg-muted/20'
							}`}
						>
							<div className="flex flex-col gap-1 flex-1 min-w-0">
								<span className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
									{mod.label}
								</span>
								<p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
								{mod.slug === 'smtp' && !isEnabled && (
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
				<div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
					<div className="flex items-center gap-2 text-amber-700">
						<RefreshCw size={16} />
						<span className="text-sm font-medium">
							{__('You have unsaved changes. A page reload is recommended after saving.', 'doublescale')}
						</span>
					</div>
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
