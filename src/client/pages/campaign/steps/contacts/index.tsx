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
import type { Filter as FilterType } from '@quillcrm/client';
import {
	ContactList,
	PanelSettings,
	ContactsIcon,
	PanelLayout,
	PlayIcon,
	Stepper,
	ListTagFilter,
} from '@quillcrm/components';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RulesBuilder from '@/components/rules-builder';
import ConfigAPI from '@quillcrm/config';
import { useCampaignStep, campaignSteps } from '../shared';

const Contacts: React.FC = () => {
	const { campaign, saveCampaignStep, updateSettings, goToStep, saving } =
		useCampaignStep();

	// Get existing step data
	const existingContactsData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('contacts'),
		[]
	);

	const filters = campaign?.settings.filters || [];
	const setFilters = (newFilters: FilterType[]) => {
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

	// Rules builder state (shared with ConditionsModal component)
	const allRulesGroups = ConfigAPI.getAutomationRules();
	// Filter out disabled groups
	const rulesGroups = Object.keys(allRulesGroups).reduce((acc, key) => {
		if (!allRulesGroups[key].is_disabled) {
			acc[key] = allRulesGroups[key];
		}
		return acc;
	}, {} as any);
	const [filteredRulesGroups] = useState(rulesGroups);
	const firstGroup = Object.keys(filteredRulesGroups)[0];
	const firstRule = firstGroup
		? Object.keys(filteredRulesGroups[firstGroup].rules)[0]
		: '';
	const getInitialRule = () => ({
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup,
	});
	const [rules, setRules] = useState([[getInitialRule()]]);

	// Map RulesBuilder rules -> backend filters schema
	const mapRulesToFilters = (inputRules: typeof rules): any[] => {
		const flat = (inputRules || []).reduce(
			(acc, group) => acc.concat(group || []),
			[] as any[]
		);
		return flat
			.filter((r) => r && r.rule)
			.map((r) => ({
				filter: r.rule, // backend expects filter slug
				operator: r.operator || 'is',
				value: r.value ?? '',
			}));
	};

	// Helper: map backend filters -> RulesBuilder rules (single group)
	const mapFiltersToRules = (inputFilters: FilterType[]) => {
		const safe = Array.isArray(inputFilters) ? inputFilters : [];
		if (!safe.length) return [[getInitialRule()]];
		const group = safe.map((f: any) => ({
			rule: f.filter || firstRule,
			operator: f.operator || 'is',
			value: f.value ?? '',
			selectedGroup: firstGroup,
		}));
		return [group];
	};

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
				__('No recipients match the current filters.', 'quillcrm')
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
			setRules(mapFiltersToRules(filters));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterBy]);

	// (legacy duplicate) removed

	// Handle filter mode change - clear filters immediately
	const handleFilterModeChange = (newMode: string) => {
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
				__('No recipients match the current filters.', 'quillcrm')
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
					label: __('Create Campaign', 'quillcrm'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings.ab_test
						? __('A/B Test Campaign', 'quillcrm')
						: __('Standard Campaign', 'quillcrm'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'quillcrm')}
				</Button>,
			]}
			type="campaign"
		>
			{!(
				campaign?.status === 'processed' ||
				campaign?.status === 'archived'
			) && (
					<Stepper
						steps={
							campaign?.type === 'email'
								? campaignSteps
								: campaignSteps.filter(
									(step) => step.slug !== 'builder'
								)
						}
						canProceed="true"
						currentStep={campaign?.type === 'email' ? 3 : 2}
					/>
				)}

			<div className="flex gap-6 items-start">
				<div ref={panelRef} className="w-2/3">
					<PanelSettings
						title={__('Recipients', 'quillcrm')}
						description={__(
							'Select who will receive this campaign and how your audience will be split for testing',
							'quillcrm'
						)}
						icon={<ContactsIcon />}
						className="flex flex-col"
						showButtons={
							!(
								campaign?.status === 'processed' ||
								campaign?.status === 'archived'
							)
						}
						onNext={handleNext}
						onBack={() => {
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
						isLoading={saving || isApplying}
					>
						<div className="space-y-6">
							{inlineError && (
								<div className="border border-red-300 bg-red-50 text-red-700 rounded-lg px-4 py-2">
									{inlineError}
								</div>
							)}
							<div>
								<p className="text-base font-bold mb-2 text-black">
									{__('Filter By', 'quillcrm')}
								</p>
								<RadioGroup
									value={filterBy}
									onValueChange={handleFilterModeChange}
									className="flex gap-4"
								>
									<Label
										htmlFor="list-tags"
										className={`flex items-center space-x-4 w-1/2 border rounded-lg p-4 cursor-pointer ${filterBy === 'list-tags'
											? 'border-blue-500 bg-blue-50 text-blue-500'
											: 'border-gray-300 bg-white'
											}`}
									>
										<RadioGroupItem
											value="list-tags"
											id="list-tags"
										/>
										<span>
											{__('Lists and Tags', 'quillcrm')}
										</span>
									</Label>
									<Label
										htmlFor="advanced"
										className={`flex items-center space-x-4 w-1/2 border rounded-lg py-2 px-3 cursor-pointer ${filterBy === 'advanced'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300 bg-white'
											}`}
									>
										<RadioGroupItem
											value="advanced"
											id="advanced"
										/>
										<span>
											{__('Advanced Filter', 'quillcrm')}
										</span>
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
								<>
									<RulesBuilder
										rules={rules}
										onChange={setRules}
										rulesGroups={filteredRulesGroups}
									/>
									<div className="flex gap-3 mt-4">
										<Button
											variant="secondaryDeepBlue"
											onClick={() => {
												// Sync filters then reuse existing handler
												setFilters(
													mapRulesToFilters(rules)
												);
												setApplyRequested(true);
												setIsApplying(true);
												handleApplyFilters();
											}}
											disabled={isLoading || isApplying}
										>
											{__('Apply Filters', 'quillcrm')}
										</Button>
										<Button
											variant="destructive"
											onClick={() => {
												setRules([[getInitialRule()]]);
												setFilters([]);
												setApplyRequested(true);
												setIsApplying(true);
												handleApplyFilters();
											}}
											disabled={isLoading || isApplying}
										>
											{__('Clear Filters', 'quillcrm')}
										</Button>
									</div>
								</>
							)}
						</div>
					</PanelSettings>
				</div>

				{/* Contact List Component */}
				<ContactList
					filters={filters}
					loading={isApplying}
					maxHeight={panelHeight}
					shouldFetch={shouldFetchContacts}
					onFetchComplete={() => setShouldFetchContacts(false)}
					onTotalChange={setTotalRecipients}
					onLoadingChange={setIsLoading}
					campaignType={campaign?.type}
				/>
			</div>
		</PanelLayout>
	);
};

export default Contacts;
