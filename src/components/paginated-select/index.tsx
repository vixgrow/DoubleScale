/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import Select from 'react-select';

/**
 * Internal dependencies
 */
import { Tag } from '@quillcrm/components';
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
	value: number[];
	onChange: (value: number[]) => void;
	endpoint: string; // e.g., '/qc/v1/lists' or '/qc/v1/tags'
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
	const [savedItems, setSavedItems] = useState<DataItem[]>([]);
	const [options, setOptions] = useState<SelectOption[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

	const fetchItems = useCallback(
		async (
			keyword = '',
			ids: number[] = [],
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
						ids: ids.length > 0 ? ids : undefined,
						per_page: perPage,
						page: page,
					}),
				})) as ApiResponse;

				const newOptions = response.data.map((item: DataItem) => ({
					label: item.name,
					value: item.id,
				}));

				// Update saved items for selected items display
				if (ids.length > 0) {
					setSavedItems((prev) => {
						const existingIds = new Set(
							prev.map((item) => item.id)
						);
						const newItems = response.data.filter(
							(item) => !existingIds.has(item.id)
						);
						return [...prev, ...newItems];
					});
				}

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

	// Load initial options or search
	const loadOptions = useCallback(
		async (search = '', reset = true) => {
			if (reset) {
				setIsLoading(true);
				setCurrentPage(1);
				setOptions([]);
			} else {
				setIsLoadingMore(true);
			}

			const page = reset ? 1 : currentPage + 1;

			try {
				const { options: newOptions, hasMore: hasMoreResults } =
					await fetchItems(search, [], page);

				setOptions((prev) =>
					reset ? newOptions : [...prev, ...newOptions]
				);
				setCurrentPage(page);
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
		[currentPage, fetchItems]
	);

	// Handle search input change
	const handleInputChange = useCallback(
		(inputValue: string) => {
			setSearchTerm(inputValue);
			loadOptions(inputValue, true);
		},
		[loadOptions]
	);

	// Load more options
	const loadMoreOptions = useCallback(() => {
		if (hasMore && !isLoading && !isLoadingMore) {
			loadOptions(searchTerm, false);
		}
	}, [hasMore, isLoading, isLoadingMore, searchTerm, loadOptions]);

	// Load initial options when component mounts
	useEffect(() => {
		loadOptions('', true);
	}, []); // Empty dependency array for initial load only

	// Load initial selected items
	useEffect(() => {
		if (value?.length) {
			fetchItems('', value).then(({ options }) => {
				setSavedItems(
					options.map(
						(opt) =>
							({ id: opt.value, name: opt.label }) as DataItem
					)
				);
			});
		}
	}, [value, fetchItems]);

	// Create options with loading indicator
	const optionsWithLoading = useMemo(() => {
		const allOptions = [...options];

		// Add loading indicator at the end if we're loading more and have more data
		if (isLoadingMore && hasMore) {
			allOptions.push({
				label: __('Loading more...', 'quillcrm'),
				value: -1,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		} else if (!isLoadingMore && hasMore && options.length > 0) {
			// Add "Load more" indicator when not loading but more data is available
			allOptions.push({
				label: __('Scroll down for more...', 'quillcrm'),
				value: -2,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		}

		return allOptions;
	}, [options, isLoadingMore, hasMore]);

	return (
		<div className={`qcrm-paginated-select ${className}`}>
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
								if (value.includes(val.value)) return;

								const newItems = [...value, val.value];
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
										{__('Loading...', 'quillcrm')}
									</div>
								),
								NoOptionsMessage: () => (
									<div className="px-3 py-2 text-gray-500">
										{noOptionsMessage ||
											__(
												'No options available',
												'quillcrm'
											)}
									</div>
								),
							}}
						/>
						{value && value.length > 0 && (
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
												const newItems = value.filter(
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
