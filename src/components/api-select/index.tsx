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
import PaginatedSelect from '@quillcrm/components/paginated-select';

interface Props {
	endpoint: string;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	multiple: boolean;
}

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

const API_Select = ({ endpoint, value, onChange, multiple = false }: Props) => {
	// Normalize endpoint path
	const normalizedEndpoint = useMemo(() => {
		// If endpoint starts with 'qc/v1/' or '/qc/v1/', use it as-is
		// Otherwise, prepend '/qc/v1/integrations/' for integration endpoints
		if (endpoint.startsWith('qc/v1/') || endpoint.startsWith('/qc/v1/')) {
			return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
		}
		return `/qc/v1/integrations/${endpoint}`;
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
				placeholder={__('Select option', 'quillcrm')}
				noOptionsMessage={__('No options available', 'quillcrm')}
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

				const totalPages = Math.ceil((response.total || 0) / perPage);
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
				label: __('Loading more...', 'quillcrm'),
				value: -1,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		} else if (!isLoadingMore && hasMore && options.length > 0) {
			allOptions.push({
				label: __('Scroll down for more...', 'quillcrm'),
				value: -2,
				isDisabled: true,
			} as SelectOption & { isDisabled: boolean });
		}

		return allOptions;
	}, [options, isLoadingMore, hasMore]);

	const selectedOption = options.find((opt) => opt.value === parseInt(value, 10));

	return (
		<div className="flex flex-col gap-2.5">
			<div className="flex justify-between gap-2.5">
				<div className="flex flex-col gap-2.5 flex-1">
					<Select<SelectOption, false>
						className="react-select-container"
						classNamePrefix="react-select"
						options={optionsWithLoading}
						value={selectedOption || null}
						onChange={(val: SelectOption | null) => {
							if (!val || val.value < 0) return;
							onChange(String(val.value));
						}}
						onInputChange={handleInputChange}
						onMenuScrollToBottom={loadMoreOptions}
						placeholder={__('Select option', 'quillcrm')}
						isLoading={isLoading}
						filterOption={() => true}
						isOptionDisabled={(option) => (option as any).isDisabled || false}
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
									{__('No options available', 'quillcrm')}
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
