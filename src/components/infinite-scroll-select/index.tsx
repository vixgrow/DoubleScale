/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
	useCallback,
	Fragment,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { createPortal } from 'react-dom';

/**
 * Internal dependencies
 */
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useDialogLayerContainer } from '@/components/ui/dialog-layer-context';
import { FLOATING_LAYER_Z_INDEX } from '@/components/ui/lift-radix-popper';
import { InfiniteScrollSelectProps } from './types';

/**
 * Helper function to get nested property from object using path
 */
const getNestedValue = (obj: any, path?: string): any => {
	if (!path) return obj;
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const toPositiveNumber = (value: unknown): number | undefined => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return undefined;
};

const extractRows = (response: unknown, dataPath: string): any[] => {
	if (Array.isArray(response)) {
		return response;
	}
	const nested = getNestedValue(response, dataPath);
	return Array.isArray(nested) ? nested : [];
};

type MenuStyle = {
	position: 'fixed';
	left: number;
	width: number;
	zIndex: number;
	maxHeight: number;
	top?: number;
	bottom?: number;
};

/**
 * InfiniteScrollSelect Component
 */
export const InfiniteScrollSelect: React.FC<InfiniteScrollSelectProps> = ({
	value,
	onValueChange,
	placeholder = __('Select an option', 'doublescale'),
	apiEndpoint,
	apiParams = {},
	searchParamName = 'search',
	getOptionLabel,
	getOptionValue,
	getOptionGroup,
	renderOption,
	dataPath = 'data',
	totalPath = 'total',
	perPage = 10,
	selectedItem,
	disabled = false,
	loading: externalLoading = false,
	error: externalError,
	className = '',
	inputClassName,
	menuZIndex = FLOATING_LAYER_Z_INDEX,
}) => {
	const dialogContainer = useDialogLayerContainer();
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [menuStyle, setMenuStyle] = useState<MenuStyle | null>(null);
	const [resolvedItem, setResolvedItem] = useState<any>(selectedItem);

	const inputRef = useRef<HTMLInputElement>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const loadingRef = useRef(false);
	const hasMoreRef = useRef(true);
	const pageRef = useRef(1);
	const searchRef = useRef('');
	const isOpenRef = useRef(false);
	const fetchSeqRef = useRef(0);

	const computeMenuStyle = useCallback((): MenuStyle | null => {
		const el = inputRef.current;
		if (!el) {
			return null;
		}
		const rect = el.getBoundingClientRect();
		if (!rect.width && !rect.height) {
			return null;
		}
		const viewportPadding = 8;
		const maxMenuHeight = 300;
		const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
		const spaceAbove = rect.top - viewportPadding;
		const openUpward =
			spaceBelow < Math.min(maxMenuHeight, 160) && spaceAbove > spaceBelow;
		const available = Math.max(
			120,
			openUpward ? spaceAbove : spaceBelow
		);
		const height = Math.min(maxMenuHeight, available);

		return {
			position: 'fixed',
			left: rect.left,
			width: Math.max(rect.width, 180),
			zIndex: menuZIndex,
			maxHeight: height,
			...(openUpward
				? { bottom: window.innerHeight - rect.top + 4 }
				: { top: rect.bottom + 4 }),
		};
	}, [menuZIndex]);

	const updateMenuPosition = useCallback(() => {
		const next = computeMenuStyle();
		if (next) {
			setMenuStyle(next);
		}
	}, [computeMenuStyle]);

	/**
	 * Fetch data from API
	 */
	const fetchData = useCallback(
		async (pageNum: number, searchValue: string) => {
			if (loadingRef.current && pageNum !== 1) {
				return;
			}

			const seq = ++fetchSeqRef.current;
			loadingRef.current = true;
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

				// Ignore stale responses from an older request.
				if (seq !== fetchSeqRef.current) {
					return;
				}

				const rows = extractRows(response, dataPath);
				const total = toPositiveNumber(
					getNestedValue(response, totalPath)
				);
				const hasNext = getNestedValue(
					response,
					'pagination.has_next'
				);

				let hasMorePages = false;
				if (typeof hasNext === 'boolean') {
					hasMorePages = hasNext;
				} else if (total !== undefined) {
					const totalPages = Math.ceil(total / perPage);
					hasMorePages = pageNum < totalPages;
				} else {
					hasMorePages = rows.length >= perPage;
				}

				if (pageNum === 1) {
					setItems(rows);
				} else {
					setItems((prev) => [...prev, ...rows]);
				}

				hasMoreRef.current = hasMorePages;
				pageRef.current = pageNum;
			} catch (err: any) {
				if (seq !== fetchSeqRef.current) {
					return;
				}
				setError(
					err.message || __('Failed to load data', 'doublescale')
				);
			} finally {
				if (seq === fetchSeqRef.current) {
					loadingRef.current = false;
					setLoading(false);
				}
			}
		},
		[apiEndpoint, apiParams, dataPath, perPage, searchParamName, totalPath]
	);

	const closeMenu = useCallback(() => {
		isOpenRef.current = false;
		setIsOpen(false);
		searchRef.current = '';
		setSearch('');
	}, []);

	const openMenu = useCallback(() => {
		if (disabled || externalLoading) {
			return;
		}

		const wasOpen = isOpenRef.current;
		isOpenRef.current = true;

		const style = computeMenuStyle();
		if (style) {
			setMenuStyle(style);
		}
		setIsOpen(true);

		// Always (re)load page 1 when opening from closed so the list is ready.
		if (!wasOpen) {
			fetchData(1, searchRef.current);
		}
	}, [
		computeMenuStyle,
		disabled,
		externalLoading,
		fetchData,
	]);

	/**
	 * Debounced search
	 */
	const debouncedFetch = useRef(
		debounce((searchValue: string, load: typeof fetchData) => {
			load(1, searchValue);
		}, 300)
	).current;

	/**
	 * Handle search input change
	 */
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		searchRef.current = newValue;
		setSearch(newValue);

		if (!isOpenRef.current) {
			openMenu();
		}

		if (newValue.trim()) {
			debouncedFetch(newValue, fetchData);
		} else {
			debouncedFetch.cancel();
			fetchData(1, '');
		}
	};

	/**
	 * Handle scroll for infinite loading
	 */
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

		if (
			scrollHeight - scrollTop - clientHeight < 50 &&
			hasMoreRef.current &&
			!loadingRef.current
		) {
			fetchData(pageRef.current + 1, searchRef.current);
		}
	};

	/**
	 * Handle item selection
	 */
	const handleSelect = (item: any) => {
		setResolvedItem(item);
		onValueChange(getOptionValue(item), item);
		closeMenu();
	};

	/**
	 * Keep selectedItem prop in sync when the parent provides one.
	 */
	useEffect(() => {
		if (selectedItem) {
			setResolvedItem(selectedItem);
		}
	}, [selectedItem]);

	/**
	 * Resolve label for a saved value without opening the menu
	 * (so "Name (email)" shows immediately in the closed input).
	 */
	useEffect(() => {
		if (
			value === undefined ||
			value === null ||
			value === '' ||
			!apiEndpoint
		) {
			if (!value) {
				setResolvedItem(undefined);
			}
			return;
		}

		const valueStr = String(value);
		const fromItems = items.find(
			(item) => String(getOptionValue(item)) === valueStr
		);
		if (fromItems) {
			setResolvedItem(fromItems);
			return;
		}

		if (
			resolvedItem &&
			String(getOptionValue(resolvedItem)) === valueStr
		) {
			return;
		}

		if (selectedItem && String(getOptionValue(selectedItem)) === valueStr) {
			setResolvedItem(selectedItem);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const response = await apiFetch({
					path: addQueryArgs(apiEndpoint, {
						include: valueStr,
						per_page: 1,
						...apiParams,
					}),
					method: 'GET',
				});
				if (cancelled) {
					return;
				}
				const rows = extractRows(response, dataPath);
				const match =
					rows.find(
						(item) => String(getOptionValue(item)) === valueStr
					) || rows[0];
				if (match) {
					setResolvedItem(match);
				}
			} catch {
				// Keep whatever label we already have.
			}
		})();

		return () => {
			cancelled = true;
		};
		// Intentionally omit items/resolvedItem to avoid re-fetch loops;
		// we only need to resolve when value/endpoint config changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, apiEndpoint, dataPath, JSON.stringify(apiParams ?? {})]);

	/**
	 * Close dropdown when clicking outside (do NOT close on input blur —
	 * blur fires before the list paints / while scrolling the portaled menu).
	 */
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				rootRef.current?.contains(target) ||
				dropdownRef.current?.contains(target)
			) {
				return;
			}
			closeMenu();
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, closeMenu]);

	/**
	 * Position the menu before paint when opening, and keep it aligned.
	 */
	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}
		updateMenuPosition();
	}, [isOpen, updateMenuPosition, items.length, loading]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const onReposition = () => updateMenuPosition();
		window.addEventListener('resize', onReposition);
		window.addEventListener('scroll', onReposition, true);

		return () => {
			window.removeEventListener('resize', onReposition);
			window.removeEventListener('scroll', onReposition, true);
		};
	}, [isOpen, updateMenuPosition]);

	/**
	 * Ensure selected/resolved item is in the open list
	 */
	useEffect(() => {
		const current = resolvedItem || selectedItem;
		if (!current || !value || items.length === 0) {
			return;
		}
		const selectedValue = String(value);
		const exists = items.find(
			(item) => String(getOptionValue(item)) === selectedValue
		);
		if (!exists) {
			setItems((prev) => {
				const stillNotExists = !prev.find(
					(item) => String(getOptionValue(item)) === selectedValue
				);
				return stillNotExists ? [current, ...prev] : prev;
			});
		}
	}, [resolvedItem, selectedItem, value, items.length]);

	/**
	 * Cleanup debounce on unmount
	 */
	useEffect(() => {
		return () => {
			debouncedFetch.cancel();
		};
	}, [debouncedFetch]);

	/**
	 * Get display value — keep showing Name (email) while closed.
	 */
	const displayValue = () => {
		if (search) return search;
		if (isOpen) return '';

		if (value) {
			const selected = items.find(
				(item) => String(getOptionValue(item)) === String(value)
			);
			if (selected) return getOptionLabel(selected);
			if (resolvedItem) return getOptionLabel(resolvedItem);
			if (selectedItem) return getOptionLabel(selectedItem);
		}

		return '';
	};

	const displayError = externalError || error;
	const activeMenuStyle = isOpen ? menuStyle || computeMenuStyle() : null;

	const dropdown =
		isOpen && !disabled && activeMenuStyle
			? createPortal(
					<div
						ref={dropdownRef}
						data-infinite-scroll-select-menu=""
						style={activeMenuStyle}
						onScroll={handleScroll}
						onMouseDown={(event) => {
							event.preventDefault();
						}}
						onWheel={(event) => event.stopPropagation()}
						className="pointer-events-auto bg-white border border-gray-200 rounded-md shadow-lg overflow-y-auto overscroll-contain"
					>
						{loading && items.length === 0 && (
							<div className="px-3 py-2 text-sm text-gray-500">
								{__('Loading...', 'doublescale')}
							</div>
						)}

						{!loading && displayError && (
							<div className="px-3 py-2 text-sm text-destructive">
								{displayError}
							</div>
						)}

						{!loading && !displayError && items.length === 0 && (
							<div className="px-3 py-2 text-sm text-gray-500">
								{__('No items found', 'doublescale')}
							</div>
						)}

						{items.length > 0 && (
							<>
								{items.map((item, index) => {
									const itemValue = String(
										getOptionValue(item)
									);
									const isSelected =
										String(value) === itemValue;

									// Show a heading whenever the group changes
									// from the previous row. Items arrive sorted
									// by group, so this yields one label per run.
									const group = getOptionGroup
										? getOptionGroup(item)
										: '';
									const previousGroup =
										index > 0 && getOptionGroup
											? getOptionGroup(items[index - 1])
											: null;
									const showGroupHeading =
										Boolean(group) && group !== previousGroup;

									return (
										<Fragment key={itemValue}>
											{showGroupHeading && (
												<div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500">
													{group}
												</div>
											)}
											<div
												role="button"
												tabIndex={-1}
												className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
													isSelected
														? 'bg-blue-50 text-blue-600'
														: ''
												} ${getOptionGroup ? 'pl-6' : ''}`}
												onMouseDown={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleSelect(item);
												}}
											>
												{renderOption
													? renderOption(item)
													: getOptionLabel(item)}
											</div>
										</Fragment>
									);
								})}
								{loading && (
									<div className="px-3 py-2 text-sm text-center text-gray-500">
										{__(
											'Loading more...',
											'doublescale'
										)}
									</div>
								)}
							</>
						)}
					</div>,
					dialogContainer ?? document.body
				)
			: null;

	return (
		<div
			ref={rootRef}
			className={`infinite-scroll-select relative ${className}`}
		>
			<div className="relative">
				<Input
					ref={inputRef}
					type="text"
					value={displayValue()}
					onChange={handleSearchChange}
					onMouseDown={(e) => {
						// Open on mousedown so fetch starts before click/focus quirks.
						if (
							!disabled &&
							!externalLoading &&
							!isOpenRef.current
						) {
							e.preventDefault();
							inputRef.current?.focus();
							openMenu();
						}
					}}
					onClick={openMenu}
					placeholder={placeholder}
					disabled={disabled || externalLoading}
					autoComplete="off"
					className={cn(
						'pr-10 !rounded-lg !border-border',
						displayError &&
							'border-destructive focus-visible:border-destructive',
						inputClassName
					)}
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

			{dropdown}

			{displayError && (
				<span className="text-sm text-destructive mt-1 block">
					{displayError}
				</span>
			)}
		</div>
	);
};

export { InfiniteScrollMultiSelect } from './infinite-scroll-multi-select';

export default InfiniteScrollSelect;
