/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useSelect, useDispatch } from '@wordpress/data';
import type { Filter as FilterType } from '@quillcrm/client';
import {
	ContactList,
	PanelLayout,
	PanelSettings,
	TeamIcon,
} from '@quillcrm/components';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ListTagFilter, AdvancedFilter } from '@quillcrm/components';

const Contacts: React.FC = () => {
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);
	const { saveCampaignStep, updateSettings } =
		useDispatch('quillcrm/campaign');
	const navigate = useNavigate();

	// Get existing step data
	const existingContactsData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('contacts'),
		[]
	);

	const filters =
		existingContactsData?.contacts?.filters ||
		campaign?.settings.filters ||
		[];
	const setFilters = (newFilters: FilterType[]) => {
		updateSettings('filters', newFilters);
	};

	const [total, setTotal] = useState(
		existingContactsData?.contacts?.contacts_count || 0
	);
	const [filterBy, setFilterBy] = useState('list-tags');
	const [isApplying, setIsApplying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [shouldFetchContacts, setShouldFetchContacts] = useState(false);
	const [panelHeight, setPanelHeight] = useState<number>(0);
	const panelRef = useRef<HTMLDivElement>(null);

	// Load existing contacts count when data changes
	useEffect(() => {
		if (existingContactsData?.contacts?.contacts_count) {
			setTotal(existingContactsData.contacts.contacts_count);
		}
	}, [existingContactsData]);

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

		// Save contacts step data - only contacts-specific data
		const contactsStepData = {
			contacts: {
				filters: filters,
				contacts_count: total,
				lastModified: new Date().toISOString(),
			},
		};

		// Save the step with contacts data and navigate only if successful
		const saveSuccess = await saveCampaignStep(
			'contacts',
			contactsStepData
		);
		if (saveSuccess) {
			navigate(getToLink(`campaigns/${campaign.id}/review`));
		} else {
			console.error('Failed to save contacts data');
			// TODO: Add notification system for error feedback
		}
	};

	return (
		<PanelLayout
			items={[]}
			totalSteps={1}
			currentStep={0}
			onNext={save}
			onBack={async () => {
				// Save current contacts data before going back
				const contactsStepData = {
					contacts: {
						filters: filters,
						contacts_count: total,
						lastModified: new Date().toISOString(),
					},
				};
				const saveSuccess = await saveCampaignStep(
					'contacts',
					contactsStepData
				);
				if (saveSuccess) {
					navigate(getToLink(`campaigns/${campaign?.id}/builder`));
				} else {
					// Navigate anyway on back, but log the error
					console.error(
						'Failed to save contacts data on back navigation'
					);
					navigate(getToLink(`campaigns/${campaign?.id}/builder`));
				}
			}}
		>
			{campaign && (
				<div className="flex gap-6 items-start">
					<div ref={panelRef} className="w-[55%]">
						<PanelSettings
							title={__('Recipients', 'quillcrm')}
							description={__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
								'quillcrm'
							)}
							icon={<TeamIcon />}
							className="flex flex-col"
						>
							<div className="space-y-6">
								<div>
									<p className="text-base font-bold mb-2">
										{__('Filter By', 'quillcrm')}
									</p>
									<RadioGroup
										value={filterBy}
										onValueChange={setFilterBy}
										className="flex gap-4"
									>
										<Label
											htmlFor="list-tags"
											className={`flex items-center space-x-4 w-1/2 border rounded-lg py-2 px-3 cursor-pointer ${
												filterBy === 'list-tags'
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-300'
											}`}
										>
											<RadioGroupItem
												value="list-tags"
												id="list-tags"
											/>
											<span>
												{__(
													'Lists and Tags',
													'quillcrm'
												)}
											</span>
										</Label>
										<Label
											htmlFor="advanced"
											className={`flex items-center space-x-4 w-1/2 border rounded-lg py-2 px-3 cursor-pointer ${
												filterBy === 'advanced'
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-300'
											}`}
										>
											<RadioGroupItem
												value="advanced"
												id="advanced"
											/>
											<span>
												{__(
													'Advanced Filter',
													'quillcrm'
												)}
											</span>
										</Label>
									</RadioGroup>
								</div>

								{/* Contact Count Display */}
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div className="text-sm font-medium text-gray-700">
										{__(
											'Total Contacts based on filters',
											'quillcrm'
										)}
										: {total.toLocaleString()}
									</div>
								</div>

								{filterBy === 'list-tags' && (
									<ListTagFilter
										filters={filters}
										setFilters={setFilters}
										fetchContacts={handleApplyFilters}
										loading={isLoading}
										onApplyingChange={setIsApplying}
									/>
								)}
								{filterBy === 'advanced' && (
									<AdvancedFilter
										filters={filters}
										setFilters={setFilters}
										fetchContacts={handleApplyFilters}
										loading={isLoading}
										onApplyingChange={setIsApplying}
									/>
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
						onTotalChange={setTotal}
						onLoadingChange={setIsLoading}
					/>
				</div>
			)}
		</PanelLayout>
	);
};

export default Contacts;
