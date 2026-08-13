/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import Select from 'react-select';

/**
 * Internal dependencies
 */
import PaginatedSelect from '@doublescale/components/paginated-select';
import {
	reactSelectControl,
	reactSelectMenuOverlay,
	reactSelectMenuPortalProps,
} from '@/components/react-select-shared-styles';
import { ScrollableMenuList } from '@/components/react-select-scrollable-menu-list';

interface Props {
	endpoint: string;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	multiple: boolean;
}

interface SelectOption {
	label: string;
	value: number | string;
}

interface DataItem {
	id: number;
	name: string;
}

// Integration endpoints return flat array with value/label
interface IntegrationDataItem {
	value: string;
	label: string;
}

interface ApiResponse {
	data: DataItem[];
	total?: number;
}

// Type guard to check if response is flat array (integration format)
function isIntegrationResponse(response: any): response is IntegrationDataItem[] {
	return Array.isArray(response) && response.length > 0 && 'value' in response[0] && 'label' in response[0];
}

const API_Select = ({ endpoint, value, onChange, multiple = false }: Props) => {
	// Normalize endpoint path
	const normalizedEndpoint = useMemo(() => {
		// If endpoint starts with 'doublescale/v1/' or '/doublescale/v1/', use it as-is
		// Otherwise, prepend '/doublescale/v1/integrations/' for integration endpoints
		if (endpoint.startsWith('doublescale/v1/') || endpoint.startsWith('/doublescale/v1/')) {
			return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
		}
		return `/doublescale/v1/integrations/${endpoint}`;
	}, [endpoint]);

	// For multiple selection, use PaginatedSelect
	if (multiple) {
		// Convert value to number array for PaginatedSelect
		const normalizedValue = useMemo(() => {
			if (Array.isArray(value)) {
				return value.map((v) => (typeof v === 'number' ? v : parseInt(v, 10)));
			}
			return [];
		}, [value]);

		// Handle change from PaginatedSelect
		const handleChange = (newValue: number[]) => {
			// Return as string array for backward compatibility
			onChange(newValue.map(String));
		};

		return (
			<PaginatedSelect
				value={normalizedValue}
				onChange={handleChange}
				endpoint={normalizedEndpoint}
				placeholder={__('Select option', 'doublescale')}
				noOptionsMessage={__('No options available', 'doublescale')}
			/>
		);
	}

	// For single selection, use a simpler Select with pagination
	return (
		<SingleAPISelect
			endpoint={normalizedEndpoint}
			value={value as string}
			onChange={onChange as (value: string) => void}
		/>
	);
};

// Single selection component
const SingleAPISelect = ({
	endpoint,
	value,
	onChange,
}: {
	endpoint: string;
	value: string;
	onChange: (value: string) => void;
}) => {
	const [options, setOptions] = useState<SelectOption[]>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const perPage = 10;

	const fetchItems = useCallback(
		async (keyword = '', page = 1): Promise<{
			options: SelectOption[];
			hasMore: boolean;
		}> => {
			try {
				const response = await apiFetch({
					path: addQueryArgs(endpoint, {
						keyword: keyword,
						per_page: perPage,
						page: page,
					}),
				});

				let newOptions: SelectOption[];
				let totalPages = 0;

				// Handle integration endpoints that return flat array with value/label
				if (isIntegrationResponse(response)) {
					newOptions = response.map((item) => ({
						label: item.label,
						value: typeof item.value === 'string' ? parseInt(item.value, 10) || item.value : item.value,
					})) as SelectOption[];
					// Integration endpoints typically return all items, no pagination
					totalPages = 1;
				} else {
					// Standard API response with data array containing id/name
					const apiResponse = response as ApiResponse;
					newOptions = (apiResponse.data || []).map((item: DataItem) => ({
						label: item.name,
						value: item.id,
					}));
					totalPages = Math.ceil((apiResponse.total || 0) / perPage);
				}

				const hasMorePages = page < totalPages;

				return {
					options: newOptions,
					hasMore: hasMorePages,
				};
			} catch (error) {
				console.error(error);
				return { options: [], hasMore: false };
			}
		},
		[endpoint]
	);

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
					await fetchItems(search, page);

				setOptions((prev) => (reset ? newOptions : [...prev, ...newOptions]));
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

	const handleInputChange = useCallback(
		(inputValue: string) => {
			setSearchTerm(inputValue);
			loadOptions(inputValue, true);
		},
		[loadOptions]
	);

	const loadMoreOptions = useCallback(() => {
		if (hasMore && !isLoading && !isLoadingMore) {
			loadOptions(searchTerm, false);
		}
	}, [hasMore, isLoading, isLoadingMore, searchTerm, loadOptions]);

	useEffect(() => {
		loadOptions('', true);
	}, []);

	const optionsWithLoading = useMemo(() => {
		const allOptions = [...options];

		if (isLoadingMore && hasMore) {
			allOptions.push({
				label: __('Loading more...', 'doublescale'),
				value: -1,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		} else if (!isLoadingMore && hasMore && options.length > 0) {
			allOptions.push({
				label: __('Scroll down for more...', 'doublescale'),
				value: -2,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		}

		return allOptions;
	}, [options, isLoadingMore, hasMore]);

	// Handle both string and numeric value comparison
	const selectedOption = options.find((opt) => {
		const optValue = String(opt.value);
		const searchValue = String(value);
		return optValue === searchValue;
	});

	return (
		<div className="doublescale-paginated-select doublescale-react-select flex flex-col gap-2.5">
			<div className="flex justify-between gap-2.5">
				<div className="flex flex-col gap-2.5 flex-1">
					<Select<SelectOption, false>
						className="react-select-container"
						classNamePrefix="react-select"
						{...reactSelectMenuPortalProps}
						options={optionsWithLoading}
						value={selectedOption || null}
						onChange={(val: SelectOption | null) => {
							// Skip placeholder options (negative numbers for loading states)
							if (!val || (typeof val.value === 'number' && val.value < 0)) return;
							onChange(String(val.value));
						}}
						onInputChange={handleInputChange}
						onMenuScrollToBottom={loadMoreOptions}
						placeholder={__('Select option', 'doublescale')}
						isLoading={isLoading}
						filterOption={() => true}
						isOptionDisabled={(option) => (option as any).isDisabled || false}
						styles={{
							control: (base, state) => ({
								...reactSelectControl(
									base as Record<string, unknown>,
									state
								),
								minWidth: 200,
								backgroundColor: '#ffffff',
								borderColor: '#D3D4D6',
								borderRadius: '8px',
								height: '48px',
								paddingBlock: '0',
							}),
							input: (base) => ({
								...base,
								outline: 'none',
								border: 'none',
								boxShadow: 'none',
								height: '40px',
								paddingBlock: '0',
								margin: 0,
							}),
							menuList: (styles) => ({
								...styles,
								maxHeight: 200,
								overscrollBehavior: 'contain',
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
							menu: (base) => ({
								...reactSelectMenuOverlay(base),
								color: 'black',
							}),
							menuPortal: (base) => reactSelectMenuOverlay(base),
						}}
						components={{
							MenuList: ScrollableMenuList,
							LoadingMessage: () => (
								<div className="px-3 py-2 text-gray-500">
									{__('Loading...', 'doublescale')}
								</div>
							),
							NoOptionsMessage: () => (
								<div className="px-3 py-2 text-gray-500">
									{__('No options available', 'doublescale')}
								</div>
							),
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default API_Select;
