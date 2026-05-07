/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import Select from 'react-select';

/**
 * Internal dependencies
 */
import { Tag } from '@doublescale/components';
import './style.scss';

interface SelectOption {
	label: string;
	value: number;
}

interface DataItem {
	id: number;
	name: string;
}

interface ApiResponse {
	data: DataItem[];
	total?: number;
}

interface Props {
	value?: number[];
	onChange: (value: number[]) => void;
	endpoint: string; // e.g., '/doublescale/v1/lists' or '/doublescale/v1/tags'
	placeholder: string;
	noOptionsMessage?: string;
	perPage?: number;
	className?: string;
}

const PaginatedSelect = ({
	value,
	onChange,
	endpoint,
	placeholder,
	noOptionsMessage,
	perPage = 10,
	className = '',
}: Props) => {
	// Separate state: savedItems for selected values display, options for dropdown
	const [savedItems, setSavedItems] = useState<DataItem[]>([]);
	const [options, setOptions] = useState<SelectOption[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

	// Track initialization state separately for dropdown and selected items
	const dropdownInitialized = useRef<boolean>(false);
	const selectedItemsInitialized = useRef<boolean>(false);
	const previousValueRef = useRef<number[]>([]);
	const savedItemsIdsRef = useRef<Set<number>>(new Set());
	// Keep a ref of options to check without causing re-renders
	const optionsRef = useRef<SelectOption[]>([]);
	// Track last input value to prevent unnecessary loads
	const lastInputValueRef = useRef<string>('');

	// Stable fetch function for dropdown options (doesn't affect savedItems)
	const fetchDropdownOptions = useCallback(
		async (
			keyword = '',
			page = 1
		): Promise<{
			options: SelectOption[];
			hasMore: boolean;
			total: number;
		}> => {
			try {
				const response = (await apiFetch({
					path: addQueryArgs(endpoint, {
						keyword: keyword,
						per_page: perPage,
						page: page,
					}),
				})) as ApiResponse;

				const newOptions = response.data.map((item: DataItem) => ({
					label: item.name,
					value: item.id,
				}));

				// Calculate if there are more pages
				const totalPages = Math.ceil((response.total || 0) / perPage);
				const hasMorePages = page < totalPages;

				return {
					options: newOptions,
					hasMore: hasMorePages,
					total: response.total || 0,
				};
			} catch (error) {
				console.error(error);
				return { options: [], hasMore: false, total: 0 };
			}
		},
		[endpoint, perPage]
	);

	// Separate function to fetch details for selected items only
	const fetchSelectedItemsDetails = useCallback(
		async (ids: number[]): Promise<DataItem[]> => {
			if (ids.length === 0) return [];

			try {
				const response = (await apiFetch({
					path: addQueryArgs(endpoint, {
						ids: ids,
					}),
				})) as ApiResponse;

				return response.data.map((item: DataItem) => ({
					id: item.id,
					name: item.name,
				}));
			} catch (error) {
				console.error('Error fetching selected items:', error);
				return [];
			}
		},
		[endpoint]
	);

	// Store fetch function in ref to avoid dependency issues in useEffect
	const fetchSelectedItemsDetailsRef = useRef(fetchSelectedItemsDetails);
	fetchSelectedItemsDetailsRef.current = fetchSelectedItemsDetails;

	// Load dropdown options (for the select dropdown - never affected by selections)
	// Use refs to avoid dependency on currentPage which changes
	const currentPageRef = useRef<number>(1);
	currentPageRef.current = currentPage;

	const loadOptions = useCallback(
		async (search = '', reset = true) => {
			// Prevent loading if already loading
			if (isLoading || isLoadingMore) {
				return;
			}

			if (reset) {
				setIsLoading(true);
				setCurrentPage(1);
				currentPageRef.current = 1;
				setOptions([]);
			} else {
				setIsLoadingMore(true);
			}

			const page = reset ? 1 : currentPageRef.current + 1;

			try {
				const { options: newOptions, hasMore: hasMoreResults } =
					await fetchDropdownOptions(search, page);

				setOptions((prev) => {
					const updated = reset
						? newOptions
						: [...prev, ...newOptions];
					// Update ref to keep it in sync
					optionsRef.current = updated;
					return updated;
				});
				setCurrentPage(page);
				currentPageRef.current = page;
				setHasMore(hasMoreResults);
			} catch (error) {
				console.error('Error loading options:', error);
			} finally {
				if (reset) {
					setIsLoading(false);
				} else {
					setIsLoadingMore(false);
				}
			}
		},
		[fetchDropdownOptions, isLoading, isLoadingMore]
	);

	// Handle search input change - only load if search term actually changed
	const handleInputChange = useCallback(
		(inputValue: string) => {
			// Only trigger load if input value actually changed from last known value
			// This prevents unnecessary API calls on re-renders or when react-select
			// calls onInputChange unnecessarily
			if (inputValue !== lastInputValueRef.current) {
				lastInputValueRef.current = inputValue;
				setSearchTerm(inputValue);
				// Only load if not already loading to prevent race conditions
				if (!isLoading && !isLoadingMore) {
					loadOptionsRef.current(inputValue, true);
				}
			}
		},
		[isLoading, isLoadingMore]
	);

	// Load more options
	const loadMoreOptions = useCallback(() => {
		if (hasMore && !isLoading && !isLoadingMore) {
			loadOptionsRef.current(searchTerm, false);
		}
	}, [hasMore, isLoading, isLoadingMore, searchTerm]);

	// Load initial dropdown options once on mount
	// Store loadOptions in ref to avoid dependency issues
	const loadOptionsRef = useRef(loadOptions);
	loadOptionsRef.current = loadOptions;

	useEffect(() => {
		if (!dropdownInitialized.current) {
			dropdownInitialized.current = true;
			loadOptionsRef.current('', true);
		}
	}, []); // Empty dependency array - only runs once on mount

	// Load initial selected items details only once on mount if value exists
	useEffect(() => {
		const currentValue = Array.isArray(value) ? value : [];

		// Only fetch if we have initial value and haven't initialized selected items yet
		if (!selectedItemsInitialized.current) {
			selectedItemsInitialized.current = true;

			if (currentValue.length > 0) {
				// Try to use options first if available, otherwise fetch
				const itemsFromOptions: DataItem[] = [];
				const idsToFetch: number[] = [];

				currentValue.forEach((id) => {
					const option = optionsRef.current.find(
						(opt) => opt.value === id
					);
					if (option) {
						itemsFromOptions.push({
							id: option.value,
							name: option.label,
						});
					} else {
						idsToFetch.push(id);
					}
				});

				// Add items from options immediately
				if (itemsFromOptions.length > 0) {
					setSavedItems(itemsFromOptions);
					itemsFromOptions.forEach((item) => {
						savedItemsIdsRef.current.add(item.id);
					});
				}

				// Fetch only items not in options
				if (
					idsToFetch.length > 0 &&
					fetchSelectedItemsDetailsRef.current
				) {
					fetchSelectedItemsDetailsRef
						.current(idsToFetch)
						.then((items) => {
							setSavedItems((prev) => {
								const existingIds = new Set(
									prev.map((item) => item.id)
								);
								const uniqueNewItems = items.filter(
									(item) => !existingIds.has(item.id)
								);
								uniqueNewItems.forEach((item) => {
									savedItemsIdsRef.current.add(item.id);
								});
								return [...prev, ...uniqueNewItems];
							});
						});
				}
			}
		}
	}, []); // Empty dependency array - only runs once on mount

	// Handle new selections: use dropdown options data when available, only fetch if needed
	useEffect(() => {
		// Don't process selections until initialization is complete
		if (!selectedItemsInitialized.current) {
			return;
		}

		const currentValue = Array.isArray(value) ? value : [];
		const previousValue = previousValueRef.current;

		// Skip if values haven't changed (shallow comparison)
		if (
			currentValue.length === previousValue.length &&
			currentValue.every((id, index) => id === previousValue[index])
		) {
			// Still update ref even if no changes to prevent unnecessary re-runs
			previousValueRef.current = currentValue;
			return;
		}

		// Find newly added items
		const newItemIds = currentValue.filter(
			(id) => !previousValue.includes(id)
		);

		// Find removed items and clean up savedItems
		const removedItemIds = previousValue.filter(
			(id) => !currentValue.includes(id)
		);

		// Update savedItems: remove deleted items (no API call needed)
		if (removedItemIds.length > 0) {
			setSavedItems((prev) =>
				prev.filter((item) => !removedItemIds.includes(item.id))
			);
			// Update ref
			removedItemIds.forEach((id) => {
				savedItemsIdsRef.current.delete(id);
			});
		}

		// Handle newly added items: use dropdown options data if available
		if (newItemIds.length > 0) {
			// Filter out items we already have details for
			const idsToProcess = newItemIds.filter(
				(id) => !savedItemsIdsRef.current.has(id)
			);

			if (idsToProcess.length > 0) {
				// Check if items are already in dropdown options
				const itemsFromOptions: DataItem[] = [];
				const idsToFetch: number[] = [];

				idsToProcess.forEach((id) => {
					const option = optionsRef.current.find(
						(opt) => opt.value === id
					);
					if (option) {
						// Use data from dropdown options - no fetch needed!
						itemsFromOptions.push({
							id: option.value,
							name: option.label,
						});
					} else {
						// Not in options, need to fetch
						idsToFetch.push(id);
					}
				});

				// Add items from options immediately (no API call)
				if (itemsFromOptions.length > 0) {
					setSavedItems((prev) => {
						const existingIds = new Set(
							prev.map((item) => item.id)
						);
						const uniqueNewItems = itemsFromOptions.filter(
							(item) => !existingIds.has(item.id)
						);

						// Update ref
						uniqueNewItems.forEach((item) => {
							savedItemsIdsRef.current.add(item.id);
						});

						return [...prev, ...uniqueNewItems];
					});
				}

				// Only fetch items that aren't in dropdown options
				if (
					idsToFetch.length > 0 &&
					fetchSelectedItemsDetailsRef.current
				) {
					fetchSelectedItemsDetailsRef
						.current(idsToFetch)
						.then((newItems) => {
							setSavedItems((prev) => {
								// Double-check to avoid duplicates
								const existingIds = new Set(
									prev.map((item) => item.id)
								);
								const uniqueNewItems = newItems.filter(
									(item) => !existingIds.has(item.id)
								);

								// Update ref
								uniqueNewItems.forEach((item) => {
									savedItemsIdsRef.current.add(item.id);
								});

								return [...prev, ...uniqueNewItems];
							});
						});
				}
			}
		}

		// Update ref for next comparison
		previousValueRef.current = currentValue;
	}, [value]); // Only depend on value, not the fetch function

	// Create options with loading indicator
	const optionsWithLoading = useMemo(() => {
		const allOptions = [...options];

		// Add loading indicator at the end if we're loading more and have more data
		if (isLoadingMore && hasMore) {
			allOptions.push({
				label: __('Loading more...', 'doublescale'),
				value: -1,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		} else if (!isLoadingMore && hasMore && options.length > 0) {
			// Add "Load more" indicator when not loading but more data is available
			allOptions.push({
				label: __('Scroll down for more...', 'doublescale'),
				value: -2,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		}

		return allOptions;
	}, [options, isLoadingMore, hasMore]);

	return (
		<div className={`doublescale-paginated-select ${className}`}>
			<div className="flex flex-col gap-[10px]">
				<div className="flex justify-between gap-[10px]">
					<div className="flex flex-col gap-[10px] flex-1">
						<Select<SelectOption, false>
							className="react-select-container"
							classNamePrefix="react-select"
							options={optionsWithLoading}
							value={null}
							onChange={(val: SelectOption | null) => {
								if (!val || val.value < 0) return; // Ignore loading indicators
								const currentValue = Array.isArray(value)
									? value
									: [];
								if (currentValue.includes(val.value)) return;

								const newItems = [...currentValue, val.value];
								onChange(newItems);
							}}
							onInputChange={handleInputChange}
							onMenuScrollToBottom={loadMoreOptions}
							placeholder={placeholder}
							isLoading={isLoading}
							filterOption={() => true}
							isOptionDisabled={(option) =>
								(option as any).isDisabled || false
							}
							styles={{
								control: (styles) => ({
									...styles,
									minWidth: 200,
								}),
								menuList: (styles) => ({
									...styles,
									maxHeight: 200,
								}),
								option: (styles, { isDisabled }) => ({
									...styles,
									...(isDisabled && {
										color: '#9CA3AF',
										fontStyle: 'italic',
										cursor: 'default',
										backgroundColor: 'transparent',
									}),
								}),
								menu: (base: any) => ({
									...base,
									color: 'black',
								}),
							}}
							components={{
								LoadingMessage: () => (
									<div className="px-3 py-2 text-gray-500">
										{__('Loading...', 'doublescale')}
									</div>
								),
								NoOptionsMessage: () => (
									<div className="px-3 py-2 text-gray-500">
										{noOptionsMessage ||
											__(
												'No options available',
												'doublescale'
											)}
									</div>
								),
							}}
						/>
						{Array.isArray(value) && value.length > 0 && (
							<div className="flex gap-[10px] flex-wrap">
								{value.map((item_id) => {
									const item = savedItems.find(
										(savedItem) => savedItem.id === item_id
									);
									if (!item) return null;

									return (
										<Tag
											key={item_id}
											label={item.name}
											onClose={() => {
												const currentValue =
													Array.isArray(value)
														? value
														: [];
												const newItems =
													currentValue.filter(
														(id) => id !== item_id
													);
												onChange(newItems);
											}}
										/>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaginatedSelect;
