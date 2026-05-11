import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
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

/** Optional modules shown in this order: SMTP, Pipelines (deals), Forms, Tasks, Campaigns, Booking. */
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

function getEffectiveState(
	slug: string,
	modules: ModuleInfo[],
	pending: Record<string, boolean>
): boolean {
	if (pending[slug] !== undefined) return pending[slug];
	const mod = modules.find((m) => m.slug === slug);
	return mod ? mod.enabled : true;
}

function collectDependentsToDisable(
	slug: string,
	modules: ModuleInfo[],
	current: Record<string, boolean>
): Record<string, boolean> {
	const result: Record<string, boolean> = {};
	const queue = [slug];
	while (queue.length > 0) {
		const s = queue.shift()!;
		for (const m of modules) {
			if (
				m.is_toggleable &&
				m.dependencies.includes(s) &&
				getEffectiveState(m.slug, modules, { ...current, ...result, [slug]: false })
			) {
				result[m.slug] = false;
				queue.push(m.slug);
			}
		}
	}
	return result;
}

function collectDependenciesToEnable(
	slug: string,
	modules: ModuleInfo[],
	current: Record<string, boolean>
): Record<string, boolean> {
	const result: Record<string, boolean> = {};
	const mod = modules.find((m) => m.slug === slug);
	if (!mod) return result;
	const queue = [...mod.dependencies];
	const visited = new Set<string>();
	while (queue.length > 0) {
		const dep = queue.shift()!;
		if (visited.has(dep)) continue;
		visited.add(dep);
		const depMod = modules.find((m) => m.slug === dep);
		if (!depMod || !depMod.is_toggleable) continue;
		if (!getEffectiveState(dep, modules, current)) {
			result[dep] = true;
			for (const d of depMod.dependencies) queue.push(d);
		}
	}
	return result;
}

export default function ModulesStep({ onNext, onPrevious, onSkip }: ModulesStepProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
	const [isSaving, setIsSaving] = useState(false);

	const handleToggle = useCallback(
		(slug: string, enabled: boolean) => {
			setPendingChanges((prev) => {
				let next = { ...prev, [slug]: enabled };

				if (!enabled) {
					const cascade = collectDependentsToDisable(slug, modules, next);
					next = { ...next, ...cascade };
				} else {
					const cascade = collectDependenciesToEnable(slug, modules, next);
					next = { ...next, ...cascade };
				}

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

	const handleNext = useCallback(async () => {
		if (Object.keys(pendingChanges).length === 0) {
			onNext();
			return;
		}

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
								<span
									className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
								>
									{mod.label}
								</span>
								<p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
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
