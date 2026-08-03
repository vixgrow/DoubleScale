/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useMemo, useReducer, useRef } from 'react';
/**
 * Internal dependencies
 */
import { useParams, useNavigate, getToLink } from '@doublescale/navigation';
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Automation as AutomationType } from '@doublescale/client';
import Workflow from './steps/workflow';
import Contacts from './steps/contacts';
import AutomationFunnel from '../automation-reports/automation-funnels';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, Pencil, Redo2, Undo2, X } from 'lucide-react';
import {
	WorkflowIcon,
	AutomationContactsIcon,
	AutomationAnalyticsIcon,
	EditHeaderIcon,
	AccordingRightIcon,
} from '@doublescale/components';
import { AutomationShimmer } from './automation-shimmer';
import TestRunDialog from './test-run-dialog';
import {
	moduleFetch,
	getModuleFetchBlockedNotice,
} from '@doublescale/services/module-fetch';
import { mapFunnelResponseToAnalytics } from './steps/workflow/reactflow-workflow/utils/analytics-utils';
import ArrowRightIcon from '@doublescale/shared/icons/arrow-right';

/** Ensures `steps` is always an array (PHP may serialize keyed arrays as objects). */
function normalizeAutomationPayload(raw: AutomationType): AutomationType | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	if (raw.id == null) {
		return null;
	}
	let stepsUnknown = raw.steps as unknown;
	if (!Array.isArray(stepsUnknown)) {
		stepsUnknown =
			stepsUnknown && typeof stepsUnknown === 'object'
				? Object.values(stepsUnknown as Record<string, unknown>)
				: [];
	}
	return { ...raw, steps: stepsUnknown as AutomationType['steps'] };
}

const Automation: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [state, dispatch] = useReducer(reducer, {
		automation: null,
		steps: [],
		updatedSteps: {},
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setAutomation, setSteps } = $actions;
	const { automation, steps, updatedSteps } = state;
	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [analyticsData, setAnalyticsData] = useState<any[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
	const [canUndo, setCanUndo] = useState<boolean>(false);
	const [canRedo, setCanRedo] = useState<boolean>(false);
	const [isVersioning, setIsVersioning] = useState<boolean>(false);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('doublescale/core');

	useEffect(() => {
		fetchAutomation();
	}, [id]);

	const fetchAutomation = async (
		skipLoading = false
	): Promise<AutomationType | undefined> => {
		if (!skipLoading) {
			setLoading(true);
		}

		try {
			const response = (await moduleFetch<AutomationType>('automations', {
				path: `/doublescale/v1/automations/${id}`,
			})) as AutomationType | null;

			if (!response) {
				createNotice({
					type: 'error',
					message: getModuleFetchBlockedNotice('automations'),
				});
				return undefined;
			}

			const normalized = normalizeAutomationPayload(response);
			if (!normalized) {
				createNotice({
					type: 'error',
					message: __('Invalid automation response from the server.', 'doublescale'),
				});
				return undefined;
			}

			setAutomation(normalized);
			setSteps(Array.isArray(normalized.steps) ? normalized.steps : []);

			// Fetch analytics + version history once when automation loads
			if (!skipLoading) {
				await fetchAnalyticsData(normalized.id);
				void refreshVersions(normalized.id);
			}

			return normalized;
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'doublescale'),
			});
			return undefined;
		} finally {
			if (!skipLoading) {
				setLoading(false);
			}
		}
	};

	const fetchAnalyticsData = async (automationId: number) => {
		if (!automationId) {
			setAnalyticsData([]);
			return;
		}

		try {
			setAnalyticsLoading(true);
			const response = (await apiFetch({
				path: `/doublescale/v1/automation-reports/${automationId}/get-chart-report`,
			})) as {
				funnel_data?: Array<{
					step_id: number | null;
					value?: number;
					percentage?: number;
					step_type?: string;
				}>;
			};

			if (response?.funnel_data) {
				setAnalyticsData(mapFunnelResponseToAnalytics(response.funnel_data));
			} else {
				setAnalyticsData([]);
			}
		} catch (error: unknown) {
			const err = error as { code?: string; message?: string };
			if (err?.code !== 'rest_no_route') {
				console.error('Failed to fetch analytics data:', error);
				createNotice({
					type: 'error',
					message:
						err?.message ||
						__(
							'Failed to load automation report analytics.',
							'doublescale'
						),
				});
			}
			setAnalyticsData([]);
		} finally {
			setAnalyticsLoading(false);
		}
	};

	const saveAutomation = async (data: Partial<AutomationType> = {}) => {
		setIsSaving(true);

		const newAutomation = { ...automation, ...data };

		try {
			const response = (await moduleFetch<AutomationType>('automations', {
				path: `/doublescale/v1/automations/${newAutomation.id}`,
				method: 'POST',
				data: newAutomation,
			})) as AutomationType | null;

			if (!response) {
				createNotice({
					type: 'error',
					message: getModuleFetchBlockedNotice('automations'),
				});
				return;
			}

			const normalizedSave = normalizeAutomationPayload(response);
			if (!normalizedSave) {
				createNotice({
					type: 'error',
					message: __('Invalid automation response from the server.', 'doublescale'),
				});
				return;
			}

			setAutomation(normalizedSave);
			setSteps(
				Array.isArray(normalizedSave.steps) ? normalizedSave.steps : []
			);
			createNotice({
				type: 'success',
				message: __('Automation saved successfully.', 'doublescale'),
			});
		} catch (error) {
			console.error(error);
			createNotice({
				type: 'error',
				message: __('Failed to save automation.', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const refreshVersions = async (automationId?: number) => {
		const targetId = automationId ?? automation?.id;
		if (!targetId) {
			return;
		}

		try {
			const response = (await moduleFetch<{
				can_undo: boolean;
				can_redo: boolean;
			}>('automations', {
				path: `/doublescale/v1/automations/${targetId}/versions`,
			})) as { can_undo: boolean; can_redo: boolean } | null;

			if (response) {
				setCanUndo(!!response.can_undo);
				setCanRedo(!!response.can_redo);
			}
		} catch (error) {
			// History is non-critical; leave button state untouched on failure.
		}
	};

	const stepHistory = async (direction: 'undo' | 'redo') => {
		const targetId = automation?.id;
		if (!targetId || isVersioning) {
			return;
		}

		setIsVersioning(true);
		try {
			const response = (await moduleFetch<
				AutomationType & {
					can_undo?: boolean;
					can_redo?: boolean;
				}
			>('automations', {
				path: `/doublescale/v1/automations/${targetId}/${direction}`,
				method: 'POST',
			})) as
				| (AutomationType & { can_undo?: boolean; can_redo?: boolean })
				| null;

			if (!response) {
				createNotice({
					type: 'error',
					message: getModuleFetchBlockedNotice('automations'),
				});
				return;
			}

			const normalized = normalizeAutomationPayload(response);
			if (!normalized) {
				createNotice({
					type: 'error',
					message: __(
						'Invalid automation response from the server.',
						'doublescale'
					),
				});
				return;
			}

			setAutomation(normalized);
			setSteps(Array.isArray(normalized.steps) ? normalized.steps : []);
			setCanUndo(!!response.can_undo);
			setCanRedo(!!response.can_redo);
		} catch (error) {
			const err = error as { message?: string };
			createNotice({
				type: 'error',
				message:
					err?.message ||
					(direction === 'undo'
						? __('Nothing to undo.', 'doublescale')
						: __('Nothing to redo.', 'doublescale')),
			});
		} finally {
			setIsVersioning(false);
		}
	};

	const undo = () => stepHistory('undo');
	const redo = () => stepHistory('redo');

	// Step mutations (add / edit / delete / reorder) are dispatched from many
	// places in the workflow builder and each persists server-side, creating a
	// new version. Rather than thread a refresh through every call site, watch a
	// signature of the steps and refresh the undo / redo button state when it
	// changes. The signature also covers the automation row (name / status /
	// settings) so automation-level saves are reflected too.
	const versionSignature = useMemo(
		() =>
			JSON.stringify({
				a: automation
					? {
							name: automation.name,
							status: automation.status,
							settings: automation.settings,
					  }
					: null,
				s: steps.map(
					(s) => `${s.id}:${s.order}:${s.status}:${s.updated_at}`
				),
			}),
		[automation, steps]
	);
	const prevVersionSignature = useRef<string | null>(null);

	useEffect(() => {
		// Skip the first run (initial load already fetches version state) and
		// any change driven by an in-flight undo / redo (handled inline there).
		if (prevVersionSignature.current === null) {
			prevVersionSignature.current = versionSignature;
			return;
		}
		if (prevVersionSignature.current === versionSignature) {
			return;
		}
		prevVersionSignature.current = versionSignature;

		if (isVersioning || !automation?.id) {
			return;
		}

		const timer = setTimeout(() => {
			void refreshVersions(automation.id);
		}, 400);
		return () => clearTimeout(timer);
	}, [versionSignature]);

	const [activeTab, setActiveTab] = useState<
		'workflow' | 'contacts' | 'reports'
	>('workflow');
	const [open, setOpen] = useState(true);
	const [editingAutomationName, setEditingAutomationName] =
		useState(false);
	const [automationNameDraft, setAutomationNameDraft] =
		useState('');
	const [testRunOpen, setTestRunOpen] = useState(false);

	useEffect(() => {
		if (automation && !editingAutomationName) {
			setAutomationNameDraft(automation.name);
		}
	}, [automation?.id, automation?.name, editingAutomationName]);

	const commitAutomationName = async () => {
		if (!automation) {
			return;
		}
		const trimmed = automationNameDraft.trim();
		if (!trimmed) {
			setAutomationNameDraft(automation.name);
			setEditingAutomationName(false);
			createNotice({
				type: 'error',
				message: __('Automation name is required', 'doublescale'),
			});
			return;
		}
		if (trimmed === automation.name) {
			setEditingAutomationName(false);
			return;
		}
		await saveAutomation({ name: trimmed });
		setEditingAutomationName(false);
	};

	const renderContent = () => {
		switch (activeTab) {
			case 'workflow':
				return <Workflow />;
			case 'contacts':
				return <Contacts />;
			case 'reports':
				return (
					<AutomationFunnel
						automation={automation}
						analyticsData={analyticsData}
						loading={analyticsLoading}
					/>
				);
			default:
				return <Workflow />;
		}
	};

	const tabs = [
		{
			id: 'workflow',
			label: __('Workflow', 'doublescale'),
			icon: WorkflowIcon,
		},
		{
			id: 'reports',
			label: __('Reports', 'doublescale'),
			icon: AutomationAnalyticsIcon,
		},
		{
			id: 'contacts',
			label: __('Contacts', 'doublescale'),
			icon: AutomationContactsIcon,
		},
	];

	return (
		<Provider
			value={{
				automation,
				steps,
				updatedSteps,
				isLoading: loading,
				isSaving,
				canUndo,
				canRedo,
				isVersioning,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveAutomation,
				refetchAutomation: () => fetchAutomation(true),
				undo,
				redo,
				refreshVersions: () => refreshVersions(),
				...$actions,
			}}
		>
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					if (!isOpen && open) {
						// Only navigate back if the dialog was closed by clicking outside or escape key
						navigate(getToLink('automations'));
					}
					setOpen(isOpen);
				}}
			>
				<DialogContent
					id="doublescale-automation-editor-dialog"
					hideCloseButton={!loading && !!automation}
					className="doublescale-automation-editor-dialog w-screen h-screen max-w-none gap-0 bg-white rounded-none shadow-none flex flex-col"
					style={{
						paddingTop: '0px',
						paddingLeft: '0px',
						paddingRight: '0px',
						paddingBottom: '0px',
					}}
					onInteractOutside={(e) => {
						// Check if the interaction is with the builder
						const target = e.target as HTMLElement;

						// Check for builder-portal-wrapper or any builder element
						const isBuilderClick =
							target.closest('#builder-portal-wrapper') !==
							null ||
							target.closest('[data-builder-portal="true"]') !==
							null ||
							target.id === 'builder-portal-wrapper' ||
							target.getAttribute('data-builder-portal') ===
							'true' ||
							document.getElementById(
								'builder-portal-wrapper'
							) !== null;

						// Prevent closing if builder is open at all
						if (isBuilderClick) {
							e.preventDefault();
						}
					}}
					onEscapeKeyDown={(e) => {
						// Prevent closing on Escape if builder is open
						const builderPortalWrapper = document.getElementById(
							'builder-portal-wrapper'
						);
						if (builderPortalWrapper) {
							e.preventDefault();
						}
					}}
				>
					{loading ? (
						<AutomationShimmer />
					) : !automation ? (
						<div className="flex flex-col items-center justify-center h-full gap-4">
							<p className="text-lg text-[#667085]">
								{__('Automation not found or failed to load.', 'doublescale')}
							</p>
							<Button
								variant="outline"
								onClick={() => navigate(getToLink('automations'))}
							>
								{__('Back to Automations', 'doublescale')}
							</Button>
						</div>
					) : (
						<>
							<DialogHeader className="border-b border-[#E4E7EC] gap-0 space-y-0 p-0 shrink-0">
								<DialogTitle className="sr-only">
									{automation?.name ||
										__(
											'Automation editor',
											'doublescale'
										)}
								</DialogTitle>

								{/* Top bar: breadcrumb | centered title | active + save */}
								<div className="flex flex-col gap-2 p-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4">
									<nav
										className="flex min-w-0 items-center justify-between gap-2 text-sm md:justify-self-start md:justify-start"
										aria-label={__(
											'Breadcrumb',
											'doublescale'
										)}
									>
										<div className="flex min-w-0 items-center gap-1.5">
											<button
												type="button"
												className="shrink-0 cursor-pointer text-base font-medium leading-7 text-foreground transition-colors hover:text-secondary"
												onClick={() =>
													navigate(
														getToLink('automations')
													)
												}
											>
												{__(
													'Automation List',
													'doublescale'
												)}
											</button>

												<AccordingRightIcon
													width={20}
													height={20}
													color="hsl(var(--foreground))"
												/>

											<span className=" truncate text-base font-medium leading-7 text-muted-foreground ">
												{__(
													'Edit Automation',
													'doublescale'
												)}
											</span>
										</div>
										<DialogClose
											type="button"
											className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#101828] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none md:hidden"
											aria-label={__(
												'Close',
												'doublescale'
											)}
										>
											<X className="h-6 w-6" />
											<span className="sr-only">
												{__('Close', 'doublescale')}
											</span>
										</DialogClose>
									</nav>

									<div className="flex max-w-[min(100%,28rem)] items-center justify-center justify-self-center gap-1.5">
										{editingAutomationName ? (
											<Input
												className="h-9 min-w-[12rem] max-w-md text-center text-base font-medium text-[#101828]"
												value={automationNameDraft}
												onChange={(e) =>
													setAutomationNameDraft(
														e.target.value
													)
												}
												onBlur={() => {
													void commitAutomationName();
												}}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														(
															e.target as HTMLInputElement
														).blur();
													}
													if (e.key === 'Escape') {
														setAutomationNameDraft(
															automation?.name ||
																''
														);
														setEditingAutomationName(
															false
														);
													}
												}}
												autoFocus
												disabled={isSaving}
												aria-label={__(
													'Automation name',
													'doublescale'
												)}
											/>
										) : (
											<>
												<button
													type="button"
													className="min-w-0 truncate text-center text-base font-medium text-[#101828] transition-colors hover:text-secondary "
													onClick={() => {
														setAutomationNameDraft(
															automation?.name ||
																''
														);
														setEditingAutomationName(
															true
														);
													}}
													title={__(
														'Click to rename',
														'doublescale'
													)}
												>
													{automation?.name ||
														__(
															'Untitled automation',
															'doublescale'
														)}
												</button>
												<button
													type="button"
													className="shrink-0 rounded-md flex items-center justify-center gap-2 text-foreground text-base font-semibold leading-6 transition-colors hover:bg-[#F9FAFB] hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
													onClick={() => {
														setAutomationNameDraft(
															automation?.name ||
																''
														);
														setEditingAutomationName(
															true
														);
													}}
													aria-label={__(
														'Edit automation name',
														'doublescale'
													)}
												>
													<EditHeaderIcon width={28} height={28} color='#3A3A99' />
												</button>
											</>
										)}
									</div>

									<div className="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:justify-end md:justify-self-end md:gap-3">
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => void undo()}
												disabled={!canUndo || isVersioning || isSaving}
												className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#344054] transition-colors hover:bg-[#F9FAFB] hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
												aria-label={__('Undo', 'doublescale')}
												title={__('Undo', 'doublescale')}
											>
												<Undo2 className="h-5 w-5" />
											</button>
											<button
												type="button"
												onClick={() => void redo()}
												disabled={!canRedo || isVersioning || isSaving}
												className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#344054] transition-colors hover:bg-[#F9FAFB] hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
												aria-label={__('Redo', 'doublescale')}
												title={__('Redo', 'doublescale')}
											>
												<Redo2 className="h-5 w-5" />
											</button>
										</div>
										{/* divider */}
										<div className="h-6 w-px bg-[#D0D0D0]"></div>
										<label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#344054]">
											<span className="hidden lg:inline">
												{__('Active', 'doublescale')}
											</span>
											<Switch
												checked={
													automation.status ===
													'active'
												}
												disabled={isSaving}
												onCheckedChange={(checked) => {
													void saveAutomation({
														status: checked
															? 'active'
															: 'inactive',
													});
												}}
												aria-label={__(
													'Automation active status',
													'doublescale'
												)}
											/>
										</label>
										{/* divider */}
										<div className="h-6 w-px bg-[#D0D0D0]"></div>
										<Button
											variant="outline"
											className="shrink-0"
											disabled={isSaving}
											onClick={() => setTestRunOpen(true)}
										>
											{__('Run manually', 'doublescale')}
										</Button>
										<Button
											variant="default"
											className="shrink-0"
											disabled={isSaving}
											onClick={() =>
												saveAutomation({
													status: 'active',
												})
											}
										>
											<span className="lg:hidden">
												{__('Save', 'doublescale')}
											</span>
											<span className="hidden lg:inline">
												{__(
													'Save & Publish',
													'doublescale'
												)}
											</span>
										</Button>
										<DialogClose
											type="button"
											className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#101828] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none md:inline-flex"
											aria-label={__(
												'Close',
												'doublescale'
											)}
										>
											<X className="h-6 w-6" />
											<span className="sr-only">
												{__('Close', 'doublescale')}
											</span>
										</DialogClose>
									</div>
								</div>

								{/* Tab row — bottom shadow over workflow canvas */}
								<div className="relative z-10 flex justify-center gap-5 border-t border-[#E4E7EC] bg-white p-3 shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]">
									{tabs.map((tab) => {
										const Icon = tab.icon;
										const isActive =
											activeTab === tab.id;
										return (
											<button
												key={tab.id}
												type="button"
												onClick={() => {
												const tabId = tab.id as
													| 'workflow'
													| 'contacts'
													| 'reports';
												setActiveTab(tabId);
												if (
													tabId === 'reports' &&
													automation?.id
												) {
													void fetchAnalyticsData(
														automation.id
													);
												}
											}}
												className={`inline-flex shrink-0 items-center gap-2 rounded-lg p-2 text-sm font-medium shadow-none transition-colors ${
													isActive
														? 'bg-[#EEF] text-brandPrimary'
														: 'border border-border text-foreground hover:bg-gray-50'
												}`}
											>
												<Icon width={24} height={24} />
												{tab.label}
											</button>
										);
									})}
								</div>
							</DialogHeader>

							<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
								<div
									className={`flex min-h-0 flex-1 flex-col ${
										activeTab === 'contacts'
											? 'overflow-y-auto overflow-x-hidden'
											: 'overflow-hidden'
									}`}
								>
									{renderContent()}
								</div>
							</div>
							<TestRunDialog
								automation={automation}
								open={testRunOpen}
								onOpenChange={setTestRunOpen}
								onSuccess={() => setActiveTab('contacts')}
							/>
						</>
					)}
				</DialogContent>
			</Dialog>
		</Provider>
	);
};

export default Automation;
