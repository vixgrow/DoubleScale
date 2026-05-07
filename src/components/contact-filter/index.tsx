import {
	useState,
	useEffect,
	useRef,
	useCallback,
	forwardRef,
	useImperativeHandle,
} from 'react';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Info, Loader2 } from 'lucide-react';
import { AlertIcon, DeleteIcon } from '@doublescale/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

// Custom hook for handling infinite scroll in SelectContent
const useInfiniteScroll = (
	callback: () => void,
	loading: boolean,
	hasMore: boolean
) => {
	const observer = useRef<IntersectionObserver | null>(null);

	const lastElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (loading || !hasMore) return;

			// Disconnect previous observer if it exists
			if (observer.current) observer.current.disconnect();

			// Create new IntersectionObserver
			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasMore && !loading) {
						callback();
					}
				},
				{
					root: null,
					threshold: 0.8,
					rootMargin: '0px',
				}
			);

			// Observe the last element
			if (node) observer.current.observe(node);
		},
		[callback, loading, hasMore]
	);

	return lastElementRef;
};

type List = {
	id: number;
	name: string;
};

type Tag = {
	id: number;
	name: string;
};

type FilterRow = {
	id: number;
	list: string;
	tag: string;
};

interface ContactFilterSectionProps {
	title: string;
	description: string;
	onReset?: () => void;
	onChange?: (rows: FilterRow[]) => void;
	initialRows?: FilterRow[];
}

// Define the exposed ref interface
export interface ContactFilterRef {
	resetFilters: () => void;
}

export const ContactFilterSection = forwardRef<
	ContactFilterRef,
	ContactFilterSectionProps
>(({ title, description, onReset, onChange, initialRows }, ref) => {
	const [rows, setRows] = useState<FilterRow[]>(
		initialRows !== undefined && initialRows.length > 0
			? initialRows
			: initialRows !== undefined && initialRows.length === 0
			? []
			: [{ id: 1, list: 'all', tag: 'all' }]
	);
	const [lists, setLists] = useState<List[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loadingLists, setLoadingLists] = useState<boolean>(false);
	const [loadingTags, setLoadingTags] = useState<boolean>(false);
	const [listsPage, setListsPage] = useState<number>(1);
	const [tagsPage, setTagsPage] = useState<number>(1);
	const [listsHasMore, setListsHasMore] = useState<boolean>(true);
	const [tagsHasMore, setTagsHasMore] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const perPage = 10;

	// Create callback references for infinite scrolling
	const handleLoadMoreListsCallback = useCallback(() => {
		if (!loadingLists && listsHasMore) {
			fetchLists(listsPage + 1);
		}
	}, [loadingLists, listsHasMore, listsPage]);

	const handleLoadMoreTagsCallback = useCallback(() => {
		if (!loadingTags && tagsHasMore) {
			fetchTags(tagsPage + 1);
		}
	}, [loadingTags, tagsHasMore, tagsPage]);

	// Get ref callbacks for observing scroll
	const lastListItemRef = useInfiniteScroll(
		handleLoadMoreListsCallback,
		loadingLists,
		listsHasMore
	);

	const lastTagItemRef = useInfiniteScroll(
		handleLoadMoreTagsCallback,
		loadingTags,
		tagsHasMore
	);

	const fetchLists = async (page = 1, keyword = '') => {
		setLoadingLists(true);
		setError(null);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/lists', {
					per_page: perPage,
					page,
					keyword,
				}),
			})) as { data: List[]; total: number };

			if (page === 1) {
				setLists(response.data);
			} else {
				setLists((prevLists) => [...prevLists, ...response.data]);
			}

			// Check if there are more pages
			const totalPages = Math.ceil(response.total / perPage);
			setListsHasMore(page < totalPages);
			setListsPage(page);
		} catch (error: any) {
			setError(error.message || __('Failed to fetch lists', 'doublescale'));
			console.error('Error fetching lists:', error);
		} finally {
			setLoadingLists(false);
		}
	};

	const fetchTags = async (page = 1, keyword = '') => {
		setLoadingTags(true);
		setError(null);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/tags', {
					per_page: perPage,
					page,
					keyword,
				}),
			})) as { data: Tag[]; total: number };

			if (page === 1) {
				setTags(response.data);
			} else {
				setTags((prevTags) => [...prevTags, ...response.data]);
			}

			// Check if there are more pages
			const totalPages = Math.ceil(response.total / perPage);
			setTagsHasMore(page < totalPages);
			setTagsPage(page);
		} catch (error: any) {
			setError(error.message || __('Failed to fetch tags', 'doublescale'));
			console.error('Error fetching tags:', error);
		} finally {
			setLoadingTags(false);
		}
	};

	// The handleLoadMore functions are now replaced by the callbacks in the useInfiniteScroll hooks

	useEffect(() => {
		// Initial data fetch
		fetchLists();
		fetchTags();
	}, []);

	// Update rows when initialRows prop changes
	useEffect(() => {
		if (initialRows && initialRows.length > 0) {
			setRows(initialRows);
		}
	}, [initialRows]);

	const addRow = () => {
		const newRows = [...rows, { id: Date.now(), list: 'all', tag: 'all' }];
		setRows(newRows);
		if (onChange) {
			onChange(newRows);
		}
	};

	const removeRow = (id: number) => {
		const newRows = rows.filter((row) => row.id !== id);
		setRows(newRows);
		if (onChange) {
			onChange(newRows);
		}
	};

	const updateRow = (id: number, field: 'list' | 'tag', value: string) => {
		const newRows = rows.map((row) =>
			row.id === id ? { ...row, [field]: value } : row
		);
		setRows(newRows);
		if (onChange) {
			onChange(newRows);
		}
	};

	// Function to reset all filters to default state
	const resetFilters = () => {
		// Reset rows to single default row
		const defaultRows = [{ id: 1, list: 'all', tag: 'all' }];
		setRows(defaultRows);
		if (onChange) {
			onChange(defaultRows);
		}

		// If parent component provided an onReset callback, call it
		if (onReset && typeof onReset === 'function') {
			onReset();
		}
	};

	// Expose the resetFilters function via ref
	useImperativeHandle(ref, () => ({
		resetFilters,
	}));

	return (
		<div className="space-y-3">
			<div>
				<p className="text-base font-bold text-black mb-1">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-2">
					{error}
				</div>
			)}
			<Card className="shadow-none overflow-hidden">
				<CardContent className="space-y-4 p-0">
					<div className="bg-gray-100 px-3 flex justify-between items-center">
						<p className="font-semibold">
							{__('Select List', 'doublescale')}
						</p>
						<p className="font-semibold">
							{__('Select Tag', 'doublescale')}
						</p>
						{/* Add Row */}
						<div
							onClick={addRow}
							className="flex items-center p-2 cursor-pointer"
						>
							<Plus className="h-6 w-6 text-[#3B82F6]" />
						</div>
					</div>
					<div className="p-3 space-y-4">
						{rows.length === 0 ? (
							<div className="py-4 text-center text-sm text-gray-500">
								{__('No filters added yet.', 'doublescale')}
							</div>
						) : (
							rows.map((row, index) => (
								<div key={row.id}>
									<div className="flex items-center gap-4">
										{/* Select List */}
										<div className="flex-1">
											<Select
												value={row.list}
												onValueChange={(value) =>
													updateRow(
														row.id,
														'list',
														value
													)
												}
											>
												<SelectTrigger className="w-full h-12">
													<SelectValue placeholder="Select List" />
												</SelectTrigger>
												<SelectContent
													position="popper"
													sideOffset={4}
													className="max-h-[300px]"
													onCloseAutoFocus={(e) =>
														e.preventDefault()
													}
												>
													<SelectItem value="all">
														All Lists
													</SelectItem>
													{lists.map(
														(list, index) => (
															<SelectItem
																key={list.id}
																value={String(
																	list.id
																)}
																ref={
																	index ===
																		lists.length -
																			1 &&
																	listsHasMore
																		? lastListItemRef
																		: undefined
																}
															>
																{list.name}
															</SelectItem>
														)
													)}
													{loadingLists && (
														<div className="flex items-center justify-center py-2">
															<Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
															<span>
																{__(
																	'Loading more...',
																	'doublescale'
																)}
															</span>
														</div>
													)}
												</SelectContent>
											</Select>
										</div>

										{/* Select Tag */}
										<div className="flex-1">
											<Select
												value={row.tag}
												onValueChange={(value) =>
													updateRow(
														row.id,
														'tag',
														value
													)
												}
											>
												<SelectTrigger className="w-full h-12">
													<SelectValue placeholder="Select Tag" />
												</SelectTrigger>
												<SelectContent
													position="popper"
													sideOffset={4}
													className="max-h-[300px]"
													onCloseAutoFocus={(e) =>
														e.preventDefault()
													}
												>
													<SelectItem value="all">
														All Contact on Selected
														list Segment
													</SelectItem>
													{tags.map((tag, index) => (
														<SelectItem
															key={tag.id}
															value={String(
																tag.id
															)}
															ref={
																index ===
																	tags.length -
																		1 &&
																tagsHasMore
																	? lastTagItemRef
																	: undefined
															}
														>
															{tag.name}
														</SelectItem>
													))}
													{loadingTags && (
														<div className="flex items-center justify-center py-2">
															<Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
															<span>
																{__(
																	'Loading more...',
																	'doublescale'
																)}
															</span>
														</div>
													)}
												</SelectContent>
											</Select>
										</div>

										{/* Remove button */}
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeRow(row.id)}
											className="text-destructive"
										>
											<DeleteIcon />
										</Button>
									</div>
									{index === 0 && (
										<div className="flex items-center gap-2 text-sm font-semibold text-secondary mt-3">
											<AlertIcon width={20} height={20} />
											{__(
												'This Question Is Required By Default',
												'doublescale'
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
});
