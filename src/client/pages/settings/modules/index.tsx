import { useState, useCallback, useMemo, useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import { getToLink } from '@doublescale/navigation';
import type { ModuleInfo } from '@doublescale/config';
import {
	buildChildModuleRows,
	buildMarketingModuleDisplayRows,
	getChildModuleToggleState,
	getEffectiveMarketingModuleState,
	isSalesDocumentsReady,
	pickToggleableModulePayload,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';
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
import { ModuleCard } from './module-card';
import './modules-settings.scss';

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

export type ModulesFooterState = {
	hasChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
};

type ModulesSettingsProps = {
	showHeader?: boolean;
	variant?: 'page' | 'dialog';
	onFooterStateChange?: ( state: ModulesFooterState ) => void;
};

/** Logical groupings for the Control Modules dialog. */
const MODULE_DIALOG_GROUPS: {
	key: string;
	label: string;
	slugs: string[];
}[] = [
	{
		key: 'email',
		label: __( 'Email & delivery', 'doublescale' ),
		slugs: [ 'smtp' ],
	},
	{
		key: 'sales',
		label: __( 'Sales', 'doublescale' ),
		slugs: [ 'sales' ],
	},
	{
		key: 'marketing',
		label: __( 'Marketing', 'doublescale' ),
		slugs: [ 'forms', 'automations', 'campaigns' ],
	},
	{
		key: 'workspace',
		label: __( 'Workspace', 'doublescale' ),
		slugs: [ 'tasks', 'booking', 'support', 'knowledgebase' ],
	},
];

export default function ModulesSettings({
	showHeader = true,
	variant = 'page',
	onFooterStateChange,
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
			const row = displayRows.find( ( mod ) => mod.slug === slug );
			if ( ! row ) {
				return false;
			}
			return (
				getEffectiveMarketingModuleState(
					row,
					modules,
					pendingChanges
				) === false
			);
		} );
	}, [ modules, pendingChanges, displayRows ] );

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
				// Full-document navigation to the SPA root rather than reloading
				// the current URL: disabling a module (e.g. Sales, the Subscriptions
				// parent) can gate the route we are on, and reloading into a route
				// that immediately redirects leaves the open dialog's Radix overlay
				// orphaned over the page (dark, frozen backdrop). Landing on the
				// always-accessible Dashboard avoids that and drops any stale modal.
				window.location.assign( getToLink( '/' ) );
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

		// In the Control Modules dialog the role-impact warning already renders
		// inline inside the module card, so a second confirmation modal is
		// redundant — and worse, stacking a Radix AlertDialog on top of the
		// dialog's own Radix modal collides the two focus traps / scroll locks
		// and freezes the page. Save directly here; only the full-page variant
		// (no surrounding modal) escalates to the confirm AlertDialog.
		if ( variant !== 'dialog' && affectedDisableModules.length > 0 ) {
			setConfirmDisableOpen( true );
			return;
		}

		void performSave();
	}, [ hasChanges, affectedDisableModules, performSave, variant ] );

	useEffect( () => {
		onFooterStateChange?.( {
			hasChanges,
			isSaving,
			onSave: handleSave,
		} );
	}, [ hasChanges, isSaving, handleSave, onFooterStateChange ] );

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

	const isDialog = variant === 'dialog';
	const showInlineFooter = ! isDialog;

	const renderModuleCard = ( mod: ( typeof displayRows )[number] ) => {
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
		const hasChildren = childRows.length > 0;

		return (
			<div
				key={mod.slug}
				className={
					hasChildren && ! isDialog ? 'md:col-span-2' : undefined
				}
			>
				<ModuleCard
					mod={mod}
					isEnabled={isEnabled}
					childRows={childRows}
					isPendingDisable={isPendingDisable}
					roleImpact={impact}
					formatRoleImpactWarning={formatRoleImpactWarning}
					onToggle={handleToggle}
					getChildChecked={( child ) =>
						getChildModuleToggleState( child, pendingChanges )
					}
					compact={isDialog}
					embedded={isDialog}
				/>
				{mod.slug === 'sales' &&
					pendingChanges[ 'sales' ] === false && (
						<p className="mx-4 mb-3 mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
							{isSalesDocumentsReady()
								? __(
										'Disabling Sales also turns off Proposals, Invoices, and Pipelines.',
										'doublescale'
								  )
								: __(
										'Disabling Sales also turns off Pipelines.',
										'doublescale'
								  )}
						</p>
					)}
			</div>
		);
	};

	const dialogGroupedModules = useMemo( () => {
		const bySlug = new Map(
			displayRows.map( ( row ) => [ row.slug, row ] )
		);
		return MODULE_DIALOG_GROUPS.map( ( group ) => ( {
			...group,
			modules: group.slugs
				.map( ( slug ) => bySlug.get( slug ) )
				.filter(
					( row ): row is ( typeof displayRows )[number] =>
						row !== undefined
				),
		} ) ).filter( ( group ) => group.modules.length > 0 );
	}, [ displayRows ] );

	return (
		<div
			className={`doublescale-control-modules flex flex-col ${isDialog ? 'gap-5' : 'gap-8'}`}
		>
			{showHeader && (
				<div>
					<h3 className="text-lg font-semibold text-foreground">
						{__( 'Modules', 'doublescale' )}
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						{isSalesDocumentsReady()
							? __(
									'Enable or disable optional features: SMTP, Sales (proposals, invoices, and the pipeline), Forms, Automations, Tasks, Campaigns, Booking, Helpdesk, and Knowledge Base. Other CRM capabilities are always available and are not listed here.',
									'doublescale'
							  )
							: __(
									'Enable or disable optional features: SMTP, Sales (with the pipeline), Forms, Automations, Tasks, Campaigns, Booking, Helpdesk, and Knowledge Base. Other CRM capabilities are always available and are not listed here.',
									'doublescale'
							  )}
					</p>
				</div>
			)}

			{isDialog ? (
				<div className="flex flex-col gap-4">
					{dialogGroupedModules.map( ( group ) => (
						<section
							key={group.key}
							className="doublescale-control-modules__section"
						>
							<div className="doublescale-control-modules__section-header">
								<h4 className="doublescale-control-modules__section-title">
									{group.label}
								</h4>
							</div>
							<div className="doublescale-control-modules__section-body">
								{group.modules.map( ( mod ) =>
									renderModuleCard( mod )
								)}
							</div>
						</section>
					) ) }
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{displayRows.map( ( mod ) => renderModuleCard( mod ) )}
				</div>
			)}

			{showInlineFooter && hasChanges && (
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

export function ModulesSaveFooter({
	hasChanges,
	isSaving,
	onSave,
}: ModulesFooterState) {
	if ( ! hasChanges ) {
		return null;
	}

	return (
		<div className="shrink-0 border-t border-border/60 bg-card px-4 py-3 lg:px-6">
			<div className="flex items-center justify-between gap-4">
				<p className="text-xs text-muted-foreground">
					{__(
						'You have unsaved module changes. Save to apply them.',
						'doublescale'
					)}
				</p>
				<Button
					onClick={onSave}
					disabled={isSaving}
					variant="gradient"
					className="min-w-[120px] shrink-0"
				>
					{isSaving
						? __( 'Saving...', 'doublescale' )
						: __( 'Save Changes', 'doublescale' )}
				</Button>
			</div>
		</div>
	);
}
