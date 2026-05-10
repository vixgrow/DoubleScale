import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw } from 'lucide-react';

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
			if (m.is_toggleable && m.dependencies.includes(s) && getEffectiveState(m.slug, modules, { ...current, ...result, [slug]: false }) ) {
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

export default function ModulesSettings() {
	const { createNotice } = useDispatch('doublescale/core');
	const [modules, setModules] = useState<ModuleInfo[]>(() => config.getModules());
	const [isSaving, setIsSaving] = useState(false);
	const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

	const hasChanges = useMemo(() => Object.keys(pendingChanges).length > 0, [pendingChanges]);

	const getDependentLabels = useCallback(
		(slug: string): string[] => {
			return modules
				.filter((m) => m.dependencies.includes(slug) && m.slug !== slug)
				.filter((m) => getEffectiveState(m.slug, modules, pendingChanges))
				.map((m) => m.label);
		},
		[modules, pendingChanges]
	);

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

	const toggleable = modules.filter((m) => m.is_toggleable);
	const required = modules.filter((m) => !m.is_toggleable);

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-lg font-semibold text-foreground">
					{__('Modules', 'doublescale')}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">
					{__('Enable or disable modules to customize your CRM. Disabled modules will not load, freeing up resources.', 'doublescale')}
				</p>
			</div>

			{required.length > 0 && (
				<div className="flex flex-col gap-3">
					<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
						{__('Always On', 'doublescale')}
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{required.map((mod) => (
							<div
								key={mod.slug}
								className="flex items-center justify-between gap-4 p-4 border border-border/60 bg-muted/30 rounded-xl opacity-75"
							>
								<div className="flex flex-col gap-1 flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-foreground">{mod.label}</span>
										<Badge variant="secondary" className="gap-1 text-[10px]">
											<Lock size={10} />
											{__('Required', 'doublescale')}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-col gap-3">
				<h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
					{__('Optional Modules', 'doublescale')}
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{toggleable.map((mod) => {
						const isEnabled = getEffectiveState(mod.slug, modules, pendingChanges);
						const dependents = getDependentLabels(mod.slug);

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
									{mod.dependencies.length > 0 && (
										<p className="text-[10px] text-muted-foreground/70 mt-0.5">
											{__('Requires:', 'doublescale')}{' '}
											{mod.dependencies
												.map((d) => modules.find((m) => m.slug === d)?.label || d)
												.join(', ')}
										</p>
									)}
									{isEnabled && dependents.length > 0 && (
										<p className="text-[10px] text-muted-foreground/70 mt-0.5">
											{__('Used by:', 'doublescale')} {dependents.join(', ')}
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
