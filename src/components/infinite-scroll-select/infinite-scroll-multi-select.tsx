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
import { X } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Badge } from '@/components/ui/badge';

const getNestedValue = (obj: unknown, path?: string): unknown => {
	if (!path) {
		return obj;
	}
	return path.split('.').reduce(
		(acc: unknown, part) =>
			acc && typeof acc === 'object' && part in (acc as object)
				? (acc as Record<string, unknown>)[part]
				: undefined,
		obj
	);
};

const extractRows = (
	response: unknown,
	dataPath: string | undefined,
	rootArrayResponse: boolean
): unknown[] => {
	if (Array.isArray(response)) {
		return response;
	}
	if (rootArrayResponse) {
		return [];
	}
	const path = dataPath === undefined ? 'data' : dataPath;
	const nested = getNestedValue(response, path);
	return Array.isArray(nested) ? nested : [];
};

const extractTotal = (
	response: unknown,
	totalPath?: string
): number | undefined => {
	if (!totalPath) {
		return undefined;
	}
	const t = getNestedValue(response, totalPath);
	return typeof t === 'number' ? t : undefined;
};

export interface InfiniteScrollMultiSelectProps {
	value: (string | number)[];
	onChange: (value: (string | number)[]) => void;
	placeholder?: string;
	apiEndpoint: string;
	apiParams?: Record<string, unknown>;
	searchParamName?: string;
	getOptionLabel: (item: unknown) => string;
	getOptionValue: (item: unknown) => string | number;
	/** When the API returns a top-level array (e.g. WooCommerce /wc/v3/products), set to true. */
	rootArrayResponse?: boolean;
	dataPath?: string;
	totalPath?: string;
	perPage?: number;
	disabled?: boolean;
	className?: string;
}

/**
 * Multi-select with the same search + infinite scroll UX as InfiniteScrollSelect.
 * Selecting an item appends it; selected items appear as removable badges.
 */
export const InfiniteScrollMultiSelect: React.FC<
	InfiniteScrollMultiSelectProps
> = ({
	value,
	onChange,
	placeholder = __('Add item…', 'doublescale'),
	apiEndpoint,
	apiParams = {},
	searchParamName = 'search',
	getOptionLabel,
	getOptionValue,
	rootArrayResponse = false,
	dataPath = 'data',
	totalPath = 'total',
	perPage = 20,
	disabled = false,
	className = '',
}) => {
	const [items, setItems] = useState<unknown[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [search, setSearch] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const fetchData = async (pageNum: number, searchValue: string) => {
		setLoading(true);
		setError(null);

		try {
			const params: Record<string, unknown> = {
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

			const data = extractRows(response, dataPath, rootArrayResponse);
			const total = extractTotal(response, totalPath);

			let hasMorePages = false;
			if (total !== undefined && total !== null) {
				const totalPages = Math.ceil(total / perPage);
				hasMorePages = pageNum < totalPages;
			} else {
				hasMorePages = data.length >= perPage;
			}

			if (pageNum === 1) {
				setItems(data);
			} else {
				setItems((prev) => [...prev, ...data]);
			}

			setHasMore(hasMorePages);
			setPage(pageNum);
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: __('Failed to load data', 'doublescale');
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const debouncedFetch = useRef(
		debounce((searchValue: string) => {
			fetchData(1, searchValue);
		}, 300)
	).current;

	const valueStrings = value.map((v) => String(v));

	const [labelsById, setLabelsById] = useState<Record<string, string>>({});

	const mergeLabels = (entries: Record<string, string>) => {
		setLabelsById((prev) => ({ ...prev, ...entries }));
	};

	/** Resolve labels when settings load from the server (IDs only). */
	useEffect(() => {
		const missing = value
			.map((v) => String(v))
			.filter((id) => !labelsById[id]);
		if (!missing.length || !apiEndpoint) {
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const path = addQueryArgs(apiEndpoint, {
					include: missing.join(','),
					per_page: 100,
					...apiParams,
				});
				const response = await apiFetch({ path, method: 'GET' });
				if (cancelled) {
					return;
				}
				const rows = extractRows(response, dataPath, rootArrayResponse);
				const next: Record<string, string> = {};
				rows.forEach((item) => {
					next[String(getOptionValue(item))] = getOptionLabel(item);
				});
				mergeLabels(next);
			} catch {
				// Keep numeric fallback labels
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [
		value,
		labelsById,
		apiEndpoint,
		JSON.stringify(apiParams ?? {}),
		dataPath,
		rootArrayResponse,
	]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setSearch(newValue);

		if (!isOpen) {
			setIsOpen(true);
			if (items.length === 0) {
				fetchData(1, '');
			}
		}

		if (newValue.trim()) {
			debouncedFetch(newValue);
		}
	};

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

	const handleSelect = (item: unknown) => {
		const id = getOptionValue(item);
		const idStr = String(id);
		if (valueStrings.includes(idStr)) {
			setSearch('');
			setIsOpen(false);
			return;
		}
		mergeLabels({ [String(id)]: getOptionLabel(item) });
		onChange([...value, id]);
		setSearch('');
		setIsOpen(false);
	};

	const handleRemove = (id: string | number) => {
		onChange(value.filter((v) => String(v) !== String(id)));
	};

	useEffect(() => {
		if (!isOpen) {
			return;
		}

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

	useEffect(() => {
		return () => {
			debouncedFetch.cancel();
		};
	}, [debouncedFetch]);

	const badgeLabel = (id: string | number) =>
		labelsById[String(id)] ?? String(id);

	return (
		<div className={`infinite-scroll-multi-select relative ${className}`}>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-2">
					{value.map((id) => (
						<Badge
							key={String(id)}
							variant="secondary"
							className="flex items-center gap-1 px-2 py-1"
						>
							<span>{badgeLabel(id)}</span>
							<button
								type="button"
								onClick={() => handleRemove(id)}
								className="ml-0.5 hover:bg-muted rounded-full p-0.5"
								aria-label={__('Remove', 'doublescale')}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={isOpen ? search : ''}
					onChange={handleSearchChange}
					onClick={() => {
						if (!isOpen) {
							setIsOpen(true);
							if (items.length === 0) {
								fetchData(1, '');
							}
						}
					}}
					placeholder={placeholder}
					disabled={disabled}
					autoComplete="off"
					className={`h-12 w-full py-[5px] px-4 pr-10 !rounded-[8px] border !border-border/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						error ? 'border-destructive' : ''
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
							{__('Loading...', 'doublescale')}
						</div>
					)}

					{!loading && error && (
						<div className="px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					{!loading && !error && items.length === 0 && (
						<div className="px-3 py-2 text-sm text-gray-500">
							{__('No items found', 'doublescale')}
						</div>
					)}

					{items.length > 0 && (
						<>
							{items.map((item) => {
								const itemValue = String(getOptionValue(item));
								const already = valueStrings.includes(itemValue);
								return (
									<div
										key={itemValue}
										role="button"
										tabIndex={0}
										className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
											already
												? 'bg-gray-50 text-gray-400'
												: ''
										}`}
										onMouseDown={(e) => {
											e.preventDefault();
											if (!already) {
												handleSelect(item);
											}
										}}
										onKeyDown={(e) => {
											if (
												e.key === 'Enter' ||
												e.key === ' '
											) {
												e.preventDefault();
												if (!already) {
													handleSelect(item);
												}
											}
										}}
									>
										{getOptionLabel(item)}
										{already
											? ` (${__('selected', 'doublescale')})`
											: ''}
									</div>
								);
							})}
							{loading && (
								<div className="px-3 py-2 text-sm text-center text-gray-500">
									{__('Loading more...', 'doublescale')}
								</div>
							)}
						</>
					)}
				</div>
			)}

			{error && (
				<span className="text-sm text-destructive mt-1 block">
					{error}
				</span>
			)}
		</div>
	);
};

export default InfiniteScrollMultiSelect;
