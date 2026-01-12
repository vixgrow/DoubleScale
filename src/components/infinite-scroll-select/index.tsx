/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { InfiniteScrollSelectProps } from './types';

/**
 * Helper function to get nested property from object using path
 */
const getNestedValue = (obj: any, path?: string): any => {
	if (!path) return obj;
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

/**
 * InfiniteScrollSelect Component
 */
export const InfiniteScrollSelect: React.FC<InfiniteScrollSelectProps> = ({
	value,
	onValueChange,
	placeholder = __('Select an option', 'quillcrm'),
	apiEndpoint,
	apiParams = {},
	searchParamName = 'search',
	getOptionLabel,
	getOptionValue,
	dataPath = 'data',
	totalPath = 'total',
	perPage = 10,
	selectedItem,
	disabled = false,
	loading: externalLoading = false,
	error: externalError,
	className = '',
}) => {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [search, setSearch] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	/**
	 * Fetch data from API
	 */
	const fetchData = async (pageNum: number, searchValue: string) => {
		setLoading(true);
		setError(null);

		try {
			const params: any = {
				page: pageNum,
				per_page: perPage,
				...apiParams,
			};

			if (searchValue.trim()) {
				params[searchParamName] = searchValue.trim();
			}

			const response = await apiFetch({
				path: addQueryArgs(apiEndpoint, params),
				method: 'GET',
			});

			const data = getNestedValue(response, dataPath) || [];
			const total = getNestedValue(response, totalPath);

			// If no total is provided, assume there are more pages if we got a full page of results
			let hasMorePages = false;
			if (total !== undefined && total !== null) {
				const totalPages = Math.ceil(total / perPage);
				hasMorePages = pageNum < totalPages;
			} else {
				// If no total, check if we got a full page (means there might be more)
				hasMorePages = data.length >= perPage;
			}

			if (pageNum === 1) {
				setItems(data);
			} else {
				setItems((prev) => [...prev, ...data]);
			}

			setHasMore(hasMorePages);
			setPage(pageNum);
		} catch (err: any) {
			setError(err.message || __('Failed to load data', 'quillcrm'));
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Debounced search
	 */
	const debouncedFetch = useRef(
		debounce((searchValue: string) => {
			fetchData(1, searchValue);
		}, 300)
	).current;

	/**
	 * Handle search input change
	 */
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setSearch(newValue);

		// Open dropdown and fetch data
		if (!isOpen) {
			setIsOpen(true);
			if (items.length === 0) {
				fetchData(1, '');
			}
		}

		// Debounced search for typed input
		if (newValue.trim()) {
			debouncedFetch(newValue);
		}
	};

	/**
	 * Handle scroll for infinite loading
	 */
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

		if (
			scrollHeight - scrollTop - clientHeight < 50 &&
			hasMore &&
			!loading
		) {
			fetchData(page + 1, search);
		}
	};

	/**
	 * Handle item selection
	 */
	const handleSelect = (item: any) => {
		onValueChange(getOptionValue(item), item);
		setSearch('');
		setIsOpen(false);
	};

	/**
	 * Handle focus - only open dropdown, don't auto-load
	 */
	const handleFocus = () => {
		// Don't open immediately to prevent auto-open on modal mount
		// User needs to click/type to open
	};

	/**
	 * Handle blur - close dropdown
	 */
	const handleBlur = () => {
		setTimeout(() => {
			setIsOpen(false);
			setSearch('');
		}, 200);
	};

	/**
	 * Close dropdown when clicking outside
	 */
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (
				inputRef.current &&
				!inputRef.current.contains(e.target as Node) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
				setSearch('');
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	/**
	 * Ensure selected item is in list 
	 */
	useEffect(() => {
		if (selectedItem && value && items.length > 0) {
			const selectedValue = String(value);
			const exists = items.find(
				(item) => String(getOptionValue(item)) === selectedValue
			);
			if (!exists) {
				// Add selectedItem only if it's not already in the list
				setItems((prev) => {
					// Double-check it's not already there to prevent duplicates
					const stillNotExists = !prev.find(
						(item) => String(getOptionValue(item)) === selectedValue
					);
					return stillNotExists ? [selectedItem, ...prev] : prev;
				});
			}
		}
	}, [selectedItem, value]);

	/**
	 * Cleanup debounce on unmount
	 */
	useEffect(() => {
		return () => {
			debouncedFetch.cancel();
		};
	}, [debouncedFetch]);

	/**
	 * Get display value
	 */
	const displayValue = () => {
		// If typing, show the search input
		if (search) return search;

		// If dropdown is open, show empty (allow typing)
		if (isOpen) return '';

		// If closed and has value, show selected item label
		if (value) {
			const selected = items.find(
				(item) => String(getOptionValue(item)) === String(value)
			);
			if (selected) return getOptionLabel(selected);
			if (selectedItem) return getOptionLabel(selectedItem);
		}

		return '';
	};

	const displayError = externalError || error;

	return (
		<div className={`infinite-scroll-select relative ${className}`}>
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={displayValue()}
					onChange={handleSearchChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onClick={() => {
						if (!isOpen) {
							setIsOpen(true);
							if (items.length === 0) {
								fetchData(1, '');
							}
						}
					}}
					placeholder={placeholder}
					disabled={disabled || externalLoading}
					autoComplete="off"
					className={`h-12 w-full py-[5px] px-4 pr-10 rounded-[8px] border border-[#DEE1E6] text-[#09090B] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						displayError ? 'border-red-500' : ''
					} ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
				/>
				<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
					<svg
						width="12"
						height="8"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1 1.5L6 6.5L11 1.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</div>

			{isOpen && !disabled && (
				<div
					ref={dropdownRef}
					onScroll={handleScroll}
					className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[300px] overflow-y-auto"
				>
					{loading && items.length === 0 && (
						<div className="px-3 py-2 text-sm text-gray-500">
							{__('Loading...', 'quillcrm')}
						</div>
					)}

					{!loading && displayError && (
						<div className="px-3 py-2 text-sm text-red-500">
							{displayError}
						</div>
					)}

					{!loading && !displayError && items.length === 0 && (
						<div className="px-3 py-2 text-sm text-gray-500">
							{__('No items found', 'quillcrm')}
						</div>
					)}

					{items.length > 0 && (
						<>
							{items.map((item) => {
								const itemValue = String(getOptionValue(item));
								const isSelected = String(value) === itemValue;
								return (
									<div
										key={itemValue}
										role="button"
										tabIndex={0}
										className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
											isSelected
												? 'bg-blue-50 text-blue-600'
												: ''
										}`}
										onMouseDown={(e) => {
											e.preventDefault();
											handleSelect(item);
										}}
										onKeyDown={(e) => {
											if (
												e.key === 'Enter' ||
												e.key === ' '
											) {
												e.preventDefault();
												handleSelect(item);
											}
										}}
									>
										{getOptionLabel(item)}
									</div>
								);
							})}
							{loading && (
								<div className="px-3 py-2 text-sm text-center text-gray-500">
									{__('Loading more...', 'quillcrm')}
								</div>
							)}
						</>
					)}
				</div>
			)}

			{displayError && (
				<span className="text-sm text-red-500 mt-1 block">
					{displayError}
				</span>
			)}
		</div>
	);
};

export default InfiniteScrollSelect;
