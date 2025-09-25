/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useCampaignContext } from '../../state/context';
import type { Filter as FilterType, ContactsResponse } from '@quillcrm/client';
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
	const { campaign, saveCampaign, updateSettings } = useCampaignContext();
	const navigate = useNavigate();
	const filters = campaign?.settings.filters || [];
	const setFilters = (newFilters: FilterType[]) => {
		updateSettings('filters', newFilters);
	};

	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [filterBy, setFilterBy] = useState('list-tags');
	const [isApplying, setIsApplying] = useState(false);
	const [shouldFetchContacts, setShouldFetchContacts] = useState(false);
	const [panelHeight, setPanelHeight] = useState<number>(0);
	const panelRef = useRef<HTMLDivElement>(null);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchContactsTotal = async (): Promise<void> => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 1,
					page: 1,
					filters: filters,
					subscribed: true,
				}),
				method: 'GET',
				parse: true,
			})) as ContactsResponse;

			setTotal(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts total', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContactsTotal();
	}, []);

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
	}, [filterBy, filters, loading, isApplying]); // Re-measure when content changes

	// Handle apply filters action
	const handleApplyFilters = async (): Promise<void> => {
		await fetchContactsTotal();
		setShouldFetchContacts(true);
	};

	const save = async () => {
		if (!campaign) {
			return;
		}
		await saveCampaign();
		navigate(getToLink(`campaigns/${campaign.id}/review`));
	};

	return (
		<PanelLayout
			items={[]}
			totalSteps={1}
			currentStep={0}
			onNext={save}
			onBack={() => navigate(getToLink(`campaigns`))}
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
										<div className="flex items-center space-x-4 w-1/2 border border-gray-600 rounded-lg py-2 px-3 cursor-pointer">
											<RadioGroupItem
												value="list-tags"
												id="list-tags"
											/>
											<Label htmlFor="list-tags">
												{__(
													'List and Tags',
													'quillcrm'
												)}
											</Label>
										</div>
										<div className="flex items-center space-x-4 w-1/2">
											<RadioGroupItem
												value="advanced"
												id="advanced"
											/>
											<Label htmlFor="advanced">
												{__(
													'Advanced Filter',
													'quillcrm'
												)}
											</Label>
										</div>
									</RadioGroup>
								</div>

								{/* Contact Count Display */}
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div className="text-sm font-medium text-gray-700">
										{__(
											'Total Contacts based on filters',
											'quillcrm'
										)}
										:
									</div>
								</div>

								{filterBy === 'list-tags' && (
									<ListTagFilter
										filters={filters}
										setFilters={setFilters}
										fetchContacts={handleApplyFilters}
										loading={loading}
										onApplyingChange={setIsApplying}
									/>
								)}
								{filterBy === 'advanced' && (
									<AdvancedFilter
										filters={filters}
										setFilters={setFilters}
										fetchContacts={handleApplyFilters}
										loading={loading}
										onApplyingChange={setIsApplying}
									/>
								)}
							</div>
						</PanelSettings>
					</div>

					{/* Contact List Component */}
					<ContactList
						filters={filters}
						total={total}
						loading={loading || isApplying}
						maxHeight={panelHeight}
						shouldFetch={shouldFetchContacts}
						onFetchComplete={() => setShouldFetchContacts(false)}
					/>
				</div>
			)}
		</PanelLayout>
	);
};

export default Contacts;
