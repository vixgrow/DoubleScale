import { __, sprintf } from '@wordpress/i18n';
import config from '@doublescale/config';
import type {
	DisplayMarketingModule,
	ChildModuleRow,
} from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
	/** When true, renders as a flat row inside a grouped list (dialog). */
	embedded?: boolean;
};

function ProHint() {
	return (
		<span className="doublescale-control-modules__hint text-[11px]">
			{__(
				'Requires DoubleScale Pro.',
				'doublescale'
			)}{' '}
			<a
				className="doublescale-control-modules__link font-medium underline-offset-2 hover:underline"
				href={config.getUrlDoubleScalePro()}
				target="_blank"
				rel="noopener noreferrer"
			>
				{__('View plans', 'doublescale')}
			</a>
		</span>
	);
}

function ModuleRow({
	iconSlug,
	label,
	description,
	isEnabled,
	isDimmed = false,
	unavailableUntilPro = false,
	proOnly = false,
	extra,
	warning,
	switchNode,
	indent = false,
	isSubmodule = false,
	parentLabel,
}: {
	iconSlug: string;
	label: string;
	description: string;
	isEnabled: boolean;
	isDimmed?: boolean;
	unavailableUntilPro?: boolean;
	proOnly?: boolean;
	extra?: React.ReactNode;
	warning?: React.ReactNode;
	switchNode: React.ReactNode;
	indent?: boolean;
	isSubmodule?: boolean;
	parentLabel?: string;
}) {
	return (
		<div
			className={cn(
				'doublescale-control-modules__row flex gap-3 px-4 py-3.5 transition-colors',
				isDimmed && 'opacity-60',
				isSubmodule && 'doublescale-control-modules__row--submodule',
				indent && !isSubmodule && 'border-l-2 border-[#0D9DFC]/20 bg-muted/10 pl-5'
			)}
		>
			{isSubmodule ? (
				<div className="doublescale-control-modules__submodule-tree" aria-hidden="true">
					<span className="doublescale-control-modules__submodule-tree-line" />
				</div>
			) : null}
			<ModuleIcon slug={iconSlug} size={isSubmodule || indent ? 'sm' : 'md'} />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					{isSubmodule && parentLabel ? (
						<span className="doublescale-control-modules__submodule-of">
							{sprintf(
								/* translators: %s: parent module label, e.g. Sales */
								__('Sub-module of %s', 'doublescale'),
								parentLabel
							)}
						</span>
					) : null}
					<span
						className={cn(
							'doublescale-control-modules__title font-semibold leading-snug',
							isSubmodule || indent ? 'text-sm' : 'text-[15px]',
							!isEnabled && 'doublescale-control-modules__title--muted'
						)}
					>
						{label}
					</span>
					{proOnly && (
						<Badge
							variant="outline"
							className="h-5 border-[#0D9DFC]/30 bg-[#E8F4FD] px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-[#0D9DFC]"
						>
							Pro
						</Badge>
					)}
				</div>
				<p className="doublescale-control-modules__description mt-0.5 text-xs leading-relaxed">
					{description}
				</p>
				{unavailableUntilPro && (
					<div className="doublescale-control-modules__hint mt-1.5">
						<ProHint />
					</div>
				)}
				{extra}
				{warning}
			</div>
			<div className="shrink-0 pt-0.5">{switchNode}</div>
		</div>
	);
}

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
	embedded = false,
}: ModuleCardProps) {
	const hasChildren = childRows.length > 0;

	const smtpWarning =
		mod.slug === 'smtp' && !isEnabled && !mod.unavailableUntilPro ? (
			<p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
				{__(
					'SMTP is important for sending emails and campaigns. Disabling it may prevent emails from being delivered.',
					'doublescale'
				)}
			</p>
		) : null;

	const roleWarning =
		isPendingDisable && roleImpact && roleImpact.user_count > 0 ? (
			<p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
				{formatRoleImpactWarning(roleImpact)}
			</p>
		) : null;

	const mainRow = (
		<ModuleRow
			iconSlug={mod.slug}
			label={mod.label}
			description={mod.description}
			isEnabled={isEnabled}
			unavailableUntilPro={mod.unavailableUntilPro}
			proOnly={mod.unavailableUntilPro}
			warning={roleWarning}
			extra={smtpWarning}
			switchNode={
				<Switch
					checked={isEnabled}
					onCheckedChange={(checked) => onToggle(mod.slug, checked)}
				/>
			}
		/>
	);

	if (embedded) {
		return (
			<div className="doublescale-control-modules__module">
				{mainRow}
				{hasChildren && (
					<div className="doublescale-control-modules__submodules">
						<div className="doublescale-control-modules__submodules-header">
							{sprintf(
								/* translators: %s: parent module label, e.g. Sales */
								__('Sub-modules of %s', 'doublescale'),
								mod.label
							)}
						</div>
						<div className="doublescale-control-modules__submodules-list">
							{childRows.map((child) => {
								const childChecked = getChildChecked(child);
								return (
									<ModuleRow
										key={child.slug}
										iconSlug={child.slug}
										label={child.label}
										description={child.description}
										isEnabled={isEnabled && childChecked}
										isDimmed={!isEnabled}
										unavailableUntilPro={
											isEnabled && child.unavailableUntilPro
										}
										proOnly={child.unavailableUntilPro}
										isSubmodule
										parentLabel={mod.label}
										extra={
											!isEnabled ? (
												<p className="doublescale-control-modules__hint mt-1 text-[11px]">
													{sprintf(
														/* translators: 1: parent module label, 2: sub-feature label */
														__(
															'Enable %1$s to use %2$s.',
															'doublescale'
														),
														mod.label,
														child.label
													)}
												</p>
											) : null
										}
										switchNode={
											<Switch
												checked={childChecked}
												disabled={!isEnabled}
												onCheckedChange={(checked) =>
													onToggle(child.slug, checked)
												}
											/>
										}
									/>
								);
							})}
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex flex-col overflow-hidden rounded-xl border transition-colors',
				mod.unavailableUntilPro
					? 'border-border/40 bg-muted/10'
					: isEnabled
						? 'border-border/60 bg-card'
						: 'border-border/40 bg-muted/15',
				compact ? 'gap-0' : 'gap-3 p-5'
			)}
		>
			{compact ? (
				mainRow
			) : (
				<div className="flex items-start justify-between gap-4 p-5 pb-0">
					<div className="flex min-w-0 flex-1 items-start gap-3">
						<ModuleIcon slug={mod.slug} />
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={cn(
										'text-base font-semibold',
										isEnabled
											? 'text-foreground'
											: 'text-muted-foreground'
									)}
								>
									{mod.label}
								</span>
								{mod.unavailableUntilPro && (
									<Badge
										variant="outline"
										className="h-5 border-[#0D9DFC]/30 bg-[#E8F4FD] px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-[#0D9DFC]"
									>
										Pro
									</Badge>
								)}
							</div>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{mod.description}
							</p>
							{mod.unavailableUntilPro && (
								<div className="mt-1">
									<ProHint />
								</div>
							)}
							{smtpWarning}
							{roleWarning}
						</div>
					</div>
					<Switch
						checked={isEnabled}
						onCheckedChange={(checked) => onToggle(mod.slug, checked)}
						className="mt-1 shrink-0"
					/>
				</div>
			)}

			{hasChildren && !embedded && (
				<div
					className={cn(
						'mx-4 mb-4 overflow-hidden rounded-lg border',
						isEnabled
							? 'border-border/50 bg-muted/20'
							: 'border-border/30 bg-muted/10'
					)}
				>
					<div className="border-b border-border/40 px-3 py-2">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							{sprintf(
								/* translators: %s: parent module label, e.g. Sales */
								__('Sub-modules of %s', 'doublescale'),
								mod.label
							)}
						</span>
					</div>
					<div className="flex flex-col divide-y divide-border/40">
						{childRows.map((child) => {
							const childChecked = getChildChecked(child);
							return (
								<ModuleRow
									key={child.slug}
									iconSlug={child.slug}
									label={child.label}
									description={child.description}
									isEnabled={isEnabled && childChecked}
									isDimmed={!isEnabled}
									unavailableUntilPro={
										isEnabled && child.unavailableUntilPro
									}
									proOnly={child.unavailableUntilPro}
									isSubmodule
									parentLabel={mod.label}
									extra={
										!isEnabled ? (
											<p className="doublescale-control-modules__hint mt-1 text-[11px]">
												{sprintf(
													/* translators: 1: parent module label, 2: sub-feature label */
													__(
														'Enable %1$s to use %2$s.',
														'doublescale'
													),
													mod.label,
													child.label
												)}
											</p>
										) : null
									}
									switchNode={
										<Switch
											checked={childChecked}
											disabled={!isEnabled}
											onCheckedChange={(checked) =>
												onToggle(child.slug, checked)
											}
										/>
									}
								/>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
