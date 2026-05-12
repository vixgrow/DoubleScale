/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	ContactList,
	PanelLayout,
	PlayIcon,
	Stepper,
	ListTagFilter,
} from '@doublescale/components';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RulesBuilder from '@/components/rules-builder';
import { getFilteredRulesGroups, getInitialRule } from '@doublescale/utils';
import {
	useCampaignStep,
	campaignSteps,
	automatedCampaignSteps,
} from '../shared';
import { applyFilters } from '@wordpress/hooks';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const Contacts: React.FC = () => {
	const {
		campaign,
		saveCampaignStep,
		updateSettings,
		goToStep,
		saving,
		isNewCampaign,
	} = useCampaignStep();

	// Check if Pro is active for conditional sections
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	// Get existing step data
	const existingContactsData = useSelect(
		(select: any) => select('doublescale/campaign').getStepData('contacts'),
		[]
	);

	const filters = (campaign?.settings.filters || []) as any;
	const setFilters = (newFilters: any) => {
		updateSettings('filters', newFilters);
	};

	const [filterBy, setFilterBy] = useState(
		existingContactsData?.filter_type || 'list-tags'
	);
	const [isApplying, setIsApplying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [shouldFetchContacts, setShouldFetchContacts] = useState(false);
	const [panelHeight, setPanelHeight] = useState<number>(0);
	const panelRef = useRef<HTMLDivElement>(null);
	const [totalRecipients, setTotalRecipients] = useState(0);
	const [applyRequested, setApplyRequested] = useState(false);
	const [inlineError, setInlineError] = useState<string | null>(null);
	const [showProModal, setShowProModal] = useState(false);
	const [proFeatureName, setProFeatureName] = useState('');

	// Rules builder state (shared with ConditionsModal component) - non-automation context
	const filteredRulesGroups = getFilteredRulesGroups(false);
	const [rules, setRules] = useState([[getInitialRule(filteredRulesGroups)]]);

	// Keep applying spinner in sync with fetch lifecycle
	useEffect(() => {
		if (!shouldFetchContacts) {
			setIsApplying(false);
		}
	}, [shouldFetchContacts]);

	// After fetch completes, if this was an apply request and total is 0, show notice
	useEffect(() => {
		if (applyRequested && totalRecipients === 0) {
			setInlineError(
				__('No recipients match the current filters.', 'doublescale')
			);
			setApplyRequested(false);
		}
		if (applyRequested && totalRecipients > 0) {
			setInlineError(null);
			setApplyRequested(false);
		}
	}, [applyRequested, totalRecipients]);

	// Initialize RulesBuilder from existing saved filters (DB) when advanced mode
	useEffect(() => {
		if (filterBy === 'advanced') {
			// If filters are already in nested structure (OR groups -> AND conditions), keep them as-is
			if (Array.isArray(filters) && Array.isArray(filters[0])) {
				setRules(filters as any);
			} else {
				// Fallback to a single default rule if shape is unknown/legacy
				setRules([[getInitialRule(filteredRulesGroups)]]);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterBy]);

	// (legacy duplicate) removed

	// Handle filter mode change - clear filters immediately
	const handleFilterModeChange = (newMode: string) => {
		// Check if trying to select advanced filter without Pro
		if (newMode === 'advanced' && !isProActive) {
			setProFeatureName(__('Advanced Filter', 'doublescale'));
			setShowProModal(true);
			return;
		}

		setFilters([]); // Clear filters first
		setFilterBy(newMode); // Then change mode
		setShouldFetchContacts(true); // Trigger refetch
	};

	// Measure and sync panel height
	useEffect(() => {
		const measureHeight = () => {
			if (panelRef.current) {
				const height = panelRef.current.offsetHeight;
				setPanelHeight(height);
			}
		};

		// Initial measurement
		measureHeight();

		// Set up ResizeObserver to watch for height changes
		const resizeObserver = new ResizeObserver(() => {
			measureHeight();
		});

		if (panelRef.current) {
			resizeObserver.observe(panelRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [filterBy, filters, isApplying]); // Re-measure when content changes

	// Handle apply filters action
	const handleApplyFilters = async (): Promise<void> => {
		setShouldFetchContacts(true);
	};

	const save = async () => {
		if (!campaign) {
			return;
		}

		// Save just the filter type so we know which tab to open next time
		await saveCampaignStep('contacts', {
			filter_type: filterBy,
		});

		goToStep('review');
	};

	const handleNext = async () => {
		// Block while applying
		if (isApplying) {
			return;
		}

		// Block when zero recipients
		if (totalRecipients === 0) {
			setInlineError(
				__('No recipients match the current filters.', 'doublescale')
			);
			return;
		}

		setInlineError(null);
		await save();
	};

	return (
		<PanelLayout
			items={[
				{
					label: __('Create Campaign', 'doublescale'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings.ab_test
						? __('A/B Test Campaign', 'doublescale')
						: __('Standard Campaign', 'doublescale'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'doublescale')}
				</Button>,
			]}
			type="campaign"
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
					<div className="">
						{!(
							campaign?.status === 'processed' ||
							campaign?.status === 'archived'
						) && (
								<Stepper
									steps={
										campaign?.settings?.automated
											? automatedCampaignSteps
											: campaign?.type === 'email'
												? campaignSteps
												: campaignSteps.filter(
													(step) =>
														step.slug !==
														'builder' &&
														step.slug !==
														'email-templates'
												)
									}
									canProceed="true"
									currentStep={
										campaign?.settings?.automated
											? 5
											: campaign?.type === 'email'
												? 4
												: 2
									}
									onStepClick={goToStep}
									disableNavigation={isNewCampaign}
								/>
							)}
					</div>
					<div className="min-w-0 flex-1 rounded-2xl border border-border bg-[#F7F8FA] p-6">
						<div className="pb-6">
							<h2 className="text-xl font-semibold tracking-tight text-foreground">
								{__('Recipients', 'doublescale')}
							</h2>
							<p className="mt-3 text-sm leading-snug text-muted-foreground">
								{__(
									'Select who will receive this campaign and how your audience will be split for testing',
									'doublescale'
								)}
							</p>
						</div>
						<div className="flex gap-6">
							<div className="flex-1">
								<div className="space-y-6">
									{inlineError && (
										<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
											{inlineError}
										</div>
									)}
									<div>
										<p className="mb-2.5 text-base font-semibold text-foreground">
											{__('Filter By', 'doublescale')}
										</p>
										<RadioGroup
											value={filterBy}
											onValueChange={
												handleFilterModeChange
											}
											className="flex gap-4"
										>
											<Label
												htmlFor="list-tags"
												className={cn(
													'flex items-center justify-between text-foreground bg-white w-1/2 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150',
													filterBy === 'list-tags'
														? 'border-primary'
														: 'border-border hover:border-border/60 hover:bg-muted/30'
												)}
											>

												<span className="text-base">
													{__(
														'Lists and Tags',
														'doublescale'
													)}
												</span>
												<RadioGroupItem
													value="list-tags"
													id="list-tags"
												/>
											</Label>
											<Label
												htmlFor={
													isProActive
														? 'advanced'
														: undefined
												}
												onClick={(e) => {
													if (!isProActive) {
														e.preventDefault();
														setProFeatureName(
															__(
																'Advanced Filter',
																'doublescale'
															)
														);
														setShowProModal(true);
													}
												}}
												className={cn(
													'flex items-center justify-between text-foreground bg-white w-1/2 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150',
													filterBy === 'advanced'
														? 'border-primary'
														: 'border-border hover:border-border/60 hover:bg-muted/30',
													!isProActive
														? 'opacity-75 cursor-pointer'
														: 'cursor-pointer'
												)}
											>
												<span className="flex items-center gap-2">
													{__(
														'Advanced Filter',
														'doublescale'
													)}
													{!isProActive && (
														<Lock className="h-4 w-4 text-orange-500" />
													)}
												</span>
												<RadioGroupItem
													value="advanced"
													id="advanced"
													disabled={!isProActive}
												/>
											</Label>
										</RadioGroup>
									</div>

									{filterBy === 'list-tags' && (
										<ListTagFilter
											key="list-tags-filter"
											filters={filters}
											setFilters={setFilters}
											fetchContacts={handleApplyFilters}
											loading={isLoading}
											onApplyingChange={setIsApplying}
										/>
									)}
									{filterBy === 'advanced' && (
										<div className="space-y-6 border border-border bg-white rounded-xl p-6">
											<RulesBuilder
												rules={rules}
												onChange={setRules}
												rulesGroups={
													filteredRulesGroups
												}
											/>
											<div className="flex gap-6 justify-end">
												<Button
													variant="destructive"
													className="bg-white text-destructive border border-destructive hover:text-white"
													onClick={() => {
														setRules([
															[
																getInitialRule(
																	filteredRulesGroups
																),
															],
														]);
														setFilters([]);
														setApplyRequested(true);
														setIsApplying(true);
														handleApplyFilters();
													}}
													disabled={
														isLoading || isApplying
													}
												>
													{__(
														'Clear Filters',
														'doublescale'
													)}
												</Button>
												<Button
													variant="secondary"
													className="bg-white"
													onClick={() => {
														// Sync filters then reuse existing handler
														setFilters(
															rules as any
														);
														setApplyRequested(true);
														setIsApplying(true);
														handleApplyFilters();
													}}
													disabled={
														isLoading || isApplying
													}
												>
													{__(
														'Apply Filters',
														'doublescale'
													)}
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
							{/* Contact List Component */}
							<ContactList
								variant="summary"
								filters={filters}
								loading={isApplying}
								maxHeight={panelHeight}
								shouldFetch={shouldFetchContacts}
								onFetchComplete={() =>
									setShouldFetchContacts(false)
								}
								onTotalChange={setTotalRecipients}
								onLoadingChange={setIsLoading}
								campaignType={campaign?.type}
							/>
						</div>
					</div>
				</div>

				{/* Pro Feature Modal */}
				{showProModal && (
					<ProAutomationModal
						visible={showProModal}
						onClose={() => setShowProModal(false)}
						featureName={proFeatureName}
					/>
				)}
				<div className="flex justify-end gap-3">
					<Button
						variant="secondaryDeepBlue"
						onClick={() => {
							// Navigate based on campaign type
							if (
								campaign?.status === 'processed' ||
								campaign?.status === 'archived'
							) {
								return;
							}

							if (campaign?.type === 'sms') {
								goToStep('template');
								return;
							}

							if (campaign?.type === 'whatsapp') {
								goToStep('whatsapp-template');
								return;
							}

							// Default: email campaign
							goToStep('builder');
						}}
						disabled={saving || isApplying}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						variant="gradient"
						onClick={handleNext}
						disabled={saving || isApplying}
					>
						{saving || isApplying
							? __('Saving...', 'doublescale')
							: __('Next Step', 'doublescale')}
					</Button>
				</div>
			</div>
		</PanelLayout>
	);
};

export default Contacts;
