import { __, sprintf } from '@wordpress/i18n';
import config from '@doublescale/config';
import type { DisplayMarketingModule, ChildModuleRow } from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import { ModuleIcon } from './module-icons';

type ModuleRoleImpact = {
	slug: string;
	user_count: number;
	users: { id: number; name: string; email: string; roles: string[] }[];
	role_labels: string[];
};

type ModuleCardProps = {
	mod: DisplayMarketingModule;
	isEnabled: boolean;
	childRows: ChildModuleRow[];
	isPendingDisable: boolean;
	roleImpact?: ModuleRoleImpact;
	formatRoleImpactWarning: (impact: ModuleRoleImpact) => string;
	onToggle: (slug: string, enabled: boolean) => void;
	getChildChecked: (child: ChildModuleRow) => boolean;
	compact?: boolean;
};

export function ModuleCard({
	mod,
	isEnabled,
	childRows,
	isPendingDisable,
	roleImpact,
	formatRoleImpactWarning,
	onToggle,
	getChildChecked,
	compact = false,
}: ModuleCardProps) {
	const hasChildren = childRows.length > 0;

	return (
		<div
			className={`flex flex-col gap-3 rounded-xl border transition-colors ${
				mod.unavailableUntilPro
					? 'border-border/40 bg-muted/15'
					: isEnabled
						? 'border-border/60 bg-card'
						: 'border-border/40 bg-muted/20'
			} ${compact ? 'p-4' : 'p-5'}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 flex-1 gap-3">
					<ModuleIcon slug={mod.slug} size={compact ? 'sm' : 'md'} />
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<span
							className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${
								isEnabled ? 'text-foreground' : 'text-muted-foreground'
							}`}
						>
							{mod.label}
						</span>
						<p className="text-xs leading-relaxed text-muted-foreground">
							{mod.description}
						</p>
						{mod.unavailableUntilPro && (
							<p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
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
						{isPendingDisable && roleImpact && roleImpact.user_count > 0 && (
							<p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-800">
								{formatRoleImpactWarning(roleImpact)}
							</p>
						)}
					</div>
				</div>
				<Switch
					checked={isEnabled}
					onCheckedChange={(checked) => onToggle(mod.slug, checked)}
					className="mt-1 shrink-0"
				/>
			</div>

			{hasChildren && (
				<div
					className={`rounded-lg border ${
						isEnabled
							? 'border-border/50 bg-muted/25'
							: 'border-border/30 bg-muted/10'
					}`}
				>
					<div className="border-b border-border/40 px-3 py-2">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							{__('Sub-features', 'doublescale')}
						</span>
					</div>
					<div className="flex flex-col divide-y divide-border/40">
						{childRows.map((child) => {
							const childChecked = getChildChecked(child);

							return (
								<div
									key={child.slug}
									className={`flex items-start justify-between gap-3 px-3 py-3 ${
										!isEnabled ? 'opacity-60' : ''
									}`}
								>
									<div className="flex min-w-0 flex-1 gap-2.5">
										<ModuleIcon slug={child.slug} size="sm" />
										<div className="flex min-w-0 flex-1 flex-col gap-0.5">
											<span
												className={`text-sm font-medium ${
													isEnabled && childChecked
														? 'text-foreground'
														: 'text-muted-foreground'
												}`}
											>
												{child.label}
											</span>
											<p className="text-xs leading-relaxed text-muted-foreground">
												{child.description}
											</p>
											{!isEnabled && (
												<p className="mt-1 text-[11px] text-muted-foreground">
													{sprintf(
														/* translators: 1: parent module label, 2: sub-feature label */
														__('Enable %1$s to use %2$s.', 'doublescale'),
														mod.label,
														child.label
													)}
												</p>
											)}
											{isEnabled && child.unavailableUntilPro && (
												<p className="mt-1 text-[11px] text-muted-foreground">
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
										</div>
									</div>
									<Switch
										checked={childChecked}
										disabled={!isEnabled}
										onCheckedChange={(checked) =>
											onToggle(child.slug, checked)
										}
										className="mt-0.5 shrink-0"
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
