import { useState, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import type { ModuleInfo } from '@doublescale/config';
import {
	buildChildModuleRows,
	buildMarketingModuleDisplayRows,
	getChildModuleToggleState,
	getEffectiveMarketingModuleState,
	pickToggleableModulePayload,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

interface ModuleRoleImpactUser {
	id: number;
	name: string;
	email: string;
	roles: string[];
}

interface ModuleRoleImpact {
	slug: string;
	user_count: number;
	users: ModuleRoleImpactUser[];
	role_labels: string[];
}

// `deals` (pipeline) is a child of Sales and no longer owns roles — disabling
// only the pipeline keeps the sales roles, so it carries no role impact.
const MODULES_WITH_ROLE_IMPACT = [ 'support', 'sales' ] as const;
type ModuleRoleImpactSlug = ( typeof MODULES_WITH_ROLE_IMPACT )[number];

function isRoleImpactModule( slug: string ): slug is ModuleRoleImpactSlug {
	return ( MODULES_WITH_ROLE_IMPACT as readonly string[] ).includes( slug );
}

type ModulesSettingsProps = {
	showHeader?: boolean;
};

export default function ModulesSettings({
	showHeader = true,
}: ModulesSettingsProps = {}) {
	const { createNotice } = useDispatch( 'doublescale/core' );
	const [ modules, setModules ] = useState<ModuleInfo[]>( () =>
		config.getModules()
	);
	const [ isSaving, setIsSaving ] = useState( false );
	const [ pendingChanges, setPendingChanges ] = useState<
		Record<string, boolean>
	>( {} );
	const [ roleImpact, setRoleImpact ] = useState<
		Partial<Record<ModuleRoleImpactSlug, ModuleRoleImpact>>
	>( {} );
	const [ confirmDisableOpen, setConfirmDisableOpen ] = useState( false );

	const isProAddonActive = isProActive();
	const displayRows = useMemo(
		() => buildMarketingModuleDisplayRows( modules, isProAddonActive ),
		[ modules, isProAddonActive ]
	);

	const hasChanges = useMemo(
		() => Object.keys( pendingChanges ).length > 0,
		[ pendingChanges ]
	);

	const fetchRoleImpact = useCallback( async ( slug: ModuleRoleImpactSlug ) => {
		try {
			const response = await apiFetch<ModuleRoleImpact>( {
				path: `/doublescale/v1/modules/role-impact?slug=${ encodeURIComponent( slug ) }`,
			} );
			setRoleImpact( ( prev ) => ( { ...prev, [ slug ]: response } ) );
		} catch {
			// Non-blocking: save flow can still proceed without the warning.
		}
	}, [] );

	const handleToggle = useCallback(
		( slug: string, enabled: boolean ) => {
			setPendingChanges( ( prev ) => {
				const next = { ...prev, [ slug ]: enabled };
				return reduceMarketingModulePending( next, modules );
			} );

			if ( ! enabled && isRoleImpactModule( slug ) ) {
				void fetchRoleImpact( slug );
			} else if ( isRoleImpactModule( slug ) ) {
				setRoleImpact( ( prev ) => {
					const next = { ...prev };
					delete next[ slug ];
					return next;
				} );
			}
		},
		[ modules, fetchRoleImpact ]
	);

	const modulesPendingDisable = useMemo( () => {
		return MODULES_WITH_ROLE_IMPACT.filter( ( slug ) => {
			if ( pendingChanges[ slug ] !== false ) {
				return false;
			}
			return getEffectiveMarketingModuleState(
				{ slug } as ModuleInfo,
				modules,
				pendingChanges
			) === false;
		} );
	}, [ modules, pendingChanges ] );

	const affectedDisableModules = useMemo( () => {
		return modulesPendingDisable.filter(
			( slug ) => ( roleImpact[ slug ]?.user_count ?? 0 ) > 0
		);
	}, [ modulesPendingDisable, roleImpact ] );

	const performSave = useCallback( async () => {
		const payload = pickToggleableModulePayload( pendingChanges, modules );
		if ( Object.keys( payload ).length === 0 ) {
			setPendingChanges( {} );
			createNotice( {
				type: 'info',
				message: __(
					'Only modules available in your install can be saved. Install DoubleScale Pro to enable the remaining add-ons.',
					'doublescale'
				),
			} );
			return;
		}

		setIsSaving( true );
		try {
			const response = await apiFetch<ModulesResponse>( {
				path: '/doublescale/v1/modules',
				method: 'POST',
				data: { modules: payload },
			} );

			if ( response.success ) {
				setModules( response.modules );
				config.setModules( response.modules );
				setPendingChanges( {} );
				setRoleImpact( {} );
				window.location.reload();
				return;
			}
		} catch ( error: any ) {
			const msg =
				error?.message ||
				error?.data?.message ||
				__( 'Failed to save module settings.', 'doublescale' );
			createNotice( { type: 'error', message: msg } );
		} finally {
			setIsSaving( false );
			setConfirmDisableOpen( false );
		}
	}, [ pendingChanges, modules, createNotice ] );

	const handleSave = useCallback( () => {
		if ( ! hasChanges ) {
			return;
		}

		if ( affectedDisableModules.length > 0 ) {
			setConfirmDisableOpen( true );
			return;
		}

		void performSave();
	}, [ hasChanges, affectedDisableModules, performSave ] );

	const getModuleLabel = useCallback(
		( slug: string ) => {
			return (
				modules.find( ( mod ) => mod.slug === slug )?.label ??
				displayRows.find( ( mod ) => mod.slug === slug )?.label ??
				slug
			);
		},
		[ modules, displayRows ]
	);

	const formatRoleImpactWarning = useCallback(
		( impact: ModuleRoleImpact ) => {
			const moduleLabel = getModuleLabel( impact.slug );
			const roleList = impact.role_labels.join( ', ' );
			const countPhrase = sprintf(
				_n(
					'%d team member',
					'%d team members',
					impact.user_count,
					'doublescale'
				),
				impact.user_count
			);
			const sampleNames = impact.users
				.slice( 0, 3 )
				.map( ( user ) => user.name )
				.join( ', ' );
			const extraCount = Math.max( 0, impact.user_count - 3 );
			const affectedSuffix = sampleNames
				? extraCount > 0
					? sprintf(
							/* translators: 1: user names, 2: additional count */
							__( ' Affected: %1$s and %2$d more.', 'doublescale' ),
							sampleNames,
							extraCount
					  )
					: sprintf(
							/* translators: %s: user names */
							__( ' Affected: %s.', 'doublescale' ),
							sampleNames
					  )
				: '';

			return sprintf(
				/* translators: 1: user count phrase, 2: role names, 3: module label, 4: affected users suffix */
				__(
					'%1$s with %2$s assigned. Disabling %3$s suspends their access until you turn the module back on. Role assignments are kept.%4$s',
					'doublescale'
				),
				countPhrase,
				roleList,
				moduleLabel,
				affectedSuffix
			);
		},
		[ getModuleLabel ]
	);

	return (
		<div className="flex flex-col gap-8">
			{showHeader && (
				<div>
					<h3 className="text-lg font-semibold text-foreground">
						{__( 'Modules', 'doublescale' )}
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Enable or disable optional features: SMTP, Sales (proposals, invoices, and the pipeline), Forms, Automations, Tasks, Campaigns, Booking, and Support. Other CRM capabilities are always available and are not listed here.',
							'doublescale'
						)}
					</p>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{displayRows.map( ( mod ) => {
					const isEnabled = getEffectiveMarketingModuleState(
						mod,
						modules,
						pendingChanges
					);
					const isPendingDisable =
						isRoleImpactModule( mod.slug ) &&
						pendingChanges[ mod.slug ] === false;
					const impact = isRoleImpactModule( mod.slug )
						? roleImpact[ mod.slug ]
						: undefined;
					const childRows = buildChildModuleRows(
						mod.slug,
						modules,
						isProAddonActive
					);

					return (
						<div
							key={mod.slug}
							className={`flex flex-col gap-3 p-4 border rounded-xl transition-colors ${
								mod.unavailableUntilPro
									? 'border-border/40 bg-muted/15'
									: isEnabled
										? 'border-border/60 bg-card'
										: 'border-border/40 bg-muted/20'
							}`}
						>
							<div className="flex items-center justify-between gap-4">
								<div className="flex flex-col gap-1 flex-1 min-w-0">
									<span
										className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
									>
										{mod.label}
									</span>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{mod.description}
									</p>
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
												{__( 'View Pro plans', 'doublescale' )}
											</a>
										</p>
									)}
									{mod.slug === 'smtp' &&
										! isEnabled &&
										! mod.unavailableUntilPro && (
											<p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
												{__(
													'SMTP is important for sending emails and campaigns. Disabling it may prevent emails from being delivered.',
													'doublescale'
												)}
											</p>
										)}
									{mod.slug === 'sales' &&
										pendingChanges[ 'sales' ] === false && (
											<p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
												{__(
													'Disabling Sales also turns off Proposals, Invoices, and the Sales Pipeline.',
													'doublescale'
												)}
											</p>
										)}
									{isPendingDisable &&
										impact &&
										impact.user_count > 0 && (
											<p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2 leading-relaxed">
												{formatRoleImpactWarning( impact )}
											</p>
										)}
								</div>
								<Switch
									checked={isEnabled}
									onCheckedChange={( checked ) =>
										handleToggle( mod.slug, checked )
									}
								/>
							</div>
							{childRows.map( ( child ) => {
								const childChecked = getChildModuleToggleState(
									child,
									pendingChanges
								);

								return (
									<div
										key={child.slug}
										className={`ml-3 flex items-center justify-between gap-4 border-l-2 pl-3 ${
											isEnabled
												? 'border-border/60'
												: 'border-border/30 opacity-60'
										}`}
									>
										<div className="flex flex-col gap-1 flex-1 min-w-0">
											<span
												className={`text-sm font-medium ${isEnabled && childChecked ? 'text-foreground' : 'text-muted-foreground'}`}
											>
												{child.label}
											</span>
											<p className="text-xs text-muted-foreground leading-relaxed">
												{child.description}
											</p>
											{! isEnabled && (
												<p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
													{sprintf(
														/* translators: 1: parent module label, 2: sub-feature label */
														__( 'Enable %1$s to use %2$s.', 'doublescale' ),
														mod.label,
														child.label
													)}
												</p>
											)}
											{isEnabled && child.unavailableUntilPro && (
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
														{__( 'View Pro plans', 'doublescale' )}
													</a>
												</p>
											)}
										</div>
										<Switch
											checked={childChecked}
											disabled={! isEnabled}
											onCheckedChange={( checked ) =>
												handleToggle( child.slug, checked )
											}
										/>
									</div>
								);
							} )}
						</div>
					);
				} )}
			</div>

			{hasChanges && (
				<div className="flex items-center justify-end">
					<Button
						onClick={handleSave}
						disabled={isSaving}
						variant="gradient"
						className="min-w-[120px]"
					>
						{isSaving
							? __( 'Saving...', 'doublescale' )
							: __( 'Save Changes', 'doublescale' )}
					</Button>
				</div>
			)}

			<AlertDialog
				open={confirmDisableOpen}
				onOpenChange={setConfirmDisableOpen}
			>
				<AlertDialogContent className="max-w-lg">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__( 'Disable module with assigned team roles?', 'doublescale' )}
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>
									{__(
										'The following team members will lose access while the module is off. Their role assignments will be kept and access will return when you re-enable the module.',
										'doublescale'
									)}
								</p>
								{affectedDisableModules.map( ( slug ) => {
									const impact = roleImpact[ slug ];
									if ( ! impact || impact.user_count === 0 ) {
										return null;
									}
									return (
										<div
											key={slug}
											className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"
										>
											<p className="font-medium">
												{getModuleLabel( slug )}
											</p>
											<p className="mt-1 text-xs leading-relaxed">
												{formatRoleImpactWarning( impact )}
											</p>
										</div>
									);
								} )}
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>
							{__( 'Cancel', 'doublescale' )}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={( event ) => {
								event.preventDefault();
								void performSave();
							}}
							disabled={isSaving}
							className="bg-amber-600 hover:bg-amber-700"
						>
							{isSaving
								? __( 'Saving...', 'doublescale' )
								: __( 'Disable anyway', 'doublescale' )}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
