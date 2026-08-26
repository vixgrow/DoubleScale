import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { ListsIcon, TagsIcon } from '@doublescale/components';

type List = {
	id: number;
	name: string;
	contacts_count?: number;
	eligible_contacts_count?: number;
};

type Tag = {
	id: number;
	name: string;
	contacts_count?: number;
	eligible_contacts_count?: number;
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
	campaignType?: string;
}

export interface ContactFilterRef {
	resetFilters: () => void;
}

const perPage = 20;

const parseInitialSelections = (rows?: FilterRow[]) => {
	const listIds = new Set<string>();
	const tagIds = new Set<string>();

	if (!Array.isArray(rows)) {
		return {
			lists: [] as string[],
			tags: [] as string[],
		};
	}

	rows.forEach((row) => {
		if (!row || typeof row !== 'object') return;
		if (row.list && row.list !== 'all') {
			listIds.add(String(row.list));
		}
		if (row.tag && row.tag !== 'all') {
			tagIds.add(String(row.tag));
		}
	});

	return {
		lists: Array.from(listIds),
		tags: Array.from(tagIds),
	};
};

const buildRowsFromSelections = (
	selectedLists: string[],
	selectedTags: string[],
	defaultToAll: boolean
): FilterRow[] => {
	if (selectedLists.length === 0 && selectedTags.length === 0) {
		return defaultToAll ? [{ id: 1, list: 'all', tag: 'all' }] : [];
	}

	// Keep legacy row semantics used by backend:
	// - lists only   => [list + all tag]
	// - tags only    => [all list + tag]
	// - lists+tags   => cartesian rows [list + tag]
	if (selectedLists.length > 0 && selectedTags.length > 0) {
		let rowId = 3000;
		return selectedLists.flatMap((listId) =>
			selectedTags.map((tagId) => ({
				id: rowId++,
				list: String(listId),
				tag: String(tagId),
			}))
		);
	}

	if (selectedLists.length > 0) {
		return selectedLists.map((listId, index) => ({
			id: 1000 + index,
			list: String(listId),
			tag: 'all',
		}));
	}

	return selectedTags.map((tagId, index) => ({
		id: 2000 + index,
		list: 'all',
		tag: String(tagId),
	}));
};

const formatSelectedLabel = (
	selectedIds: string[],
	items: Array<{ id: number; name: string }>
) => {
	if (selectedIds.length === 0) {
		return '';
	}

	const names = selectedIds
		.map((selectedId) => {
			const found = items.find((item) => String(item.id) === selectedId);
			return found?.name;
		})
		.filter(Boolean) as string[];

	if (names.length === 0) {
		return '';
	}

	if (names.length <= 2) {
		return names.join(', ');
	}

	return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
};

export const ContactFilterSection = forwardRef<
	ContactFilterRef,
	ContactFilterSectionProps
>(({ title, description, onReset, onChange, initialRows, campaignType }, ref) => {
	const [lists, setLists] = useState<List[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [loadingLists, setLoadingLists] = useState(false);
	const [loadingTags, setLoadingTags] = useState(false);
	const [listsPage, setListsPage] = useState(1);
	const [tagsPage, setTagsPage] = useState(1);
	const [listsHasMore, setListsHasMore] = useState(true);
	const [tagsHasMore, setTagsHasMore] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'lists' | 'tags'>('lists');
	const [searchTerm, setSearchTerm] = useState('');
	const [defaultToAll, setDefaultToAll] = useState(initialRows === undefined);
	const [selectedLists, setSelectedLists] = useState<string[]>(() =>
		parseInitialSelections(initialRows).lists
	);
	const [selectedTags, setSelectedTags] = useState<string[]>(() =>
		parseInitialSelections(initialRows).tags
	);
	const optionsContainerRef = useRef<HTMLDivElement | null>(null);

	const fetchLists = useCallback(async (page = 1) => {
		setLoadingLists(true);
		setError(null);
		try {
			const queryArgs: Record<string, string | number> = {
				per_page: perPage,
				page,
			};
			if (campaignType) {
				queryArgs.campaign_type = campaignType;
			}
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/lists', queryArgs),
			})) as { data: List[]; total: number };

			if (page === 1) {
				setLists(response.data);
			} else {
				setLists((prev) => {
					const existing = new Set(prev.map((item) => item.id));
					const incoming = response.data.filter(
						(item) => !existing.has(item.id)
					);
					return [...prev, ...incoming];
				});
			}

			const totalPages = Math.ceil(response.total / perPage);
			setListsHasMore(page < totalPages);
			setListsPage(page);
		} catch (fetchError: any) {
			setError(fetchError.message || __('Failed to fetch lists', 'doublescale'));
			console.error('Error fetching lists:', fetchError);
		} finally {
			setLoadingLists(false);
		}
	}, [campaignType]);

	const fetchTags = useCallback(async (page = 1) => {
		setLoadingTags(true);
		setError(null);
		try {
			const queryArgs: Record<string, string | number> = {
				per_page: perPage,
				page,
			};
			if (campaignType) {
				queryArgs.campaign_type = campaignType;
			}
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/tags', queryArgs),
			})) as { data: Tag[]; total: number };

			if (page === 1) {
				setTags(response.data);
			} else {
				setTags((prev) => {
					const existing = new Set(prev.map((item) => item.id));
					const incoming = response.data.filter(
						(item) => !existing.has(item.id)
					);
					return [...prev, ...incoming];
				});
			}

			const totalPages = Math.ceil(response.total / perPage);
			setTagsHasMore(page < totalPages);
			setTagsPage(page);
		} catch (fetchError: any) {
			setError(fetchError.message || __('Failed to fetch tags', 'doublescale'));
			console.error('Error fetching tags:', fetchError);
		} finally {
			setLoadingTags(false);
		}
	}, [campaignType]);

	useEffect(() => {
		fetchLists(1);
		fetchTags(1);
	}, [fetchLists, fetchTags]);

	// Sync from parent only when the *content* of initialRows changes.
	// Parent often passes a fresh reference on each render even when rows
	// are unchanged; reacting to reference changes alone caused a render
	// loop (onChange would emit a new array which the parent would
	// normalize and pass back as a different reference, repeating forever).
	const initialRowsSignature = useMemo(
		() => (initialRows === undefined ? '__undef__' : JSON.stringify(initialRows)),
		[initialRows]
	);
	const lastSyncedSignatureRef = useRef<string | null>(null);
	useEffect(() => {
		if (lastSyncedSignatureRef.current === initialRowsSignature) {
			return;
		}
		lastSyncedSignatureRef.current = initialRowsSignature;

		const shouldDefaultToAll = initialRows === undefined;
		setDefaultToAll(shouldDefaultToAll);

		const parsed = parseInitialSelections(initialRows);
		setSelectedLists(parsed.lists);
		setSelectedTags(parsed.tags);
	}, [initialRowsSignature, initialRows]);

	useEffect(() => {
		if (!onChange) return;
		const rows = buildRowsFromSelections(
			selectedLists,
			selectedTags,
			defaultToAll
		);
		onChange(rows);
	}, [selectedLists, selectedTags, defaultToAll, onChange]);

	const resetFilters = () => {
		setSelectedLists([]);
		setSelectedTags([]);
		setSearchTerm('');
		if (onReset && typeof onReset === 'function') {
			onReset();
		}
	};

	useImperativeHandle(ref, () => ({
		resetFilters,
	}));

	const filteredLists = useMemo(() => {
		if (!searchTerm.trim()) return lists;
		const term = searchTerm.trim().toLowerCase();
		return lists.filter((item) => item.name.toLowerCase().includes(term));
	}, [lists, searchTerm]);

	const filteredTags = useMemo(() => {
		if (!searchTerm.trim()) return tags;
		const term = searchTerm.trim().toLowerCase();
		return tags.filter((item) => item.name.toLowerCase().includes(term));
	}, [tags, searchTerm]);

	const handleToggleList = (listId: string) => {
		setSelectedLists((prev) =>
			prev.includes(listId)
				? prev.filter((item) => item !== listId)
				: [...prev, listId]
		);
	};

	const handleToggleTag = (tagId: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagId)
				? prev.filter((item) => item !== tagId)
				: [...prev, tagId]
		);
	};

	const getItemRecipientCount = (item: List | Tag) => {
		if (campaignType && typeof item.eligible_contacts_count === 'number') {
			return item.eligible_contacts_count;
		}
		return item.contacts_count;
	};

	const activeItems = activeTab === 'lists' ? filteredLists : filteredTags;
	const selectedInActiveTab =
		activeTab === 'lists' ? selectedLists : selectedTags;
	const allActiveSelected =
		activeItems.length > 0 &&
		activeItems.every((item) =>
			selectedInActiveTab.includes(String(item.id))
		);

	const toggleSelectAllInActiveTab = () => {
		const activeIds = activeItems.map((item) => String(item.id));
		if (activeTab === 'lists') {
			setSelectedLists((prev) => {
				if (allActiveSelected) {
					return prev.filter((id) => !activeIds.includes(id));
				}
				const set = new Set([...prev, ...activeIds]);
				return Array.from(set);
			});
			return;
		}

		setSelectedTags((prev) => {
			if (allActiveSelected) {
				return prev.filter((id) => !activeIds.includes(id));
			}
			const set = new Set([...prev, ...activeIds]);
			return Array.from(set);
		});
	};

	const handleOptionsScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const element = event.currentTarget;
		const nearBottom =
			element.scrollHeight - element.scrollTop - element.clientHeight < 60;
		if (!nearBottom) return;

		if (activeTab === 'lists' && listsHasMore && !loadingLists) {
			fetchLists(listsPage + 1);
		}
		if (activeTab === 'tags' && tagsHasMore && !loadingTags) {
			fetchTags(tagsPage + 1);
		}
	};

	const selectedListsLabel = formatSelectedLabel(selectedLists, lists);
	const selectedTagsLabel = formatSelectedLabel(selectedTags, tags);
	const triggerLabel = [
		selectedListsLabel && `Lists: ${selectedListsLabel}`,
		selectedTagsLabel && `Tags: ${selectedTagsLabel}`,
	]
		.filter(Boolean)
		.join(' | ');

	return (
		<div className="space-y-3">
			<div>
				<p className="mb-3 text-base font-semibold text-foreground">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>

			{error && (
				<div className="mb-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-red-700">
					{error}
				</div>
			)}

			<Card className="overflow-hidden border-none p-0 bg-white shadow-none">
				<CardContent className="space-y-3 p-0 pb-1">
					<p className="text-sm font-medium text-foreground flex items-center gap-1">
						{__('Send to', 'doublescale')}
						<span className="text-destructive">
							{__('*', 'doublescale')}
						</span>
					</p>

					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground"
							>
								<span className="truncate">
									{triggerLabel ||
										__('Select by lists or tags', 'doublescale')}
								</span>
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							</button>
						</PopoverTrigger>

						<PopoverContent className="w-[560px] max-w-[90vw] p-3" align="start">
							<div className="border-b border-border px-1 pt-1">
								<div className="flex gap-8 pb-0">
									<button
										type="button"
										onClick={() => {
											setActiveTab('lists');
											if (optionsContainerRef.current) {
												optionsContainerRef.current.scrollTop = 0;
											}
										}}
										className={`flex items-center gap-2 pb-2 -mb-px transition-colors ${
											activeTab === 'lists'
												? 'text-primary border-b-2 border-primary'
												: 'text-muted-foreground hover:text-primary'
										}`}
									>
										<ListsIcon />
										<span className="text-sm">
											{__('Lists', 'doublescale')}
										</span>
									</button>
									<button
										type="button"
										onClick={() => {
											setActiveTab('tags');
											if (optionsContainerRef.current) {
												optionsContainerRef.current.scrollTop = 0;
											}
										}}
										className={`flex items-center gap-2 pb-2 -mb-px transition-colors ${
											activeTab === 'tags'
												? 'text-primary border-b-2 border-primary'
												: 'text-muted-foreground hover:text-primary'
										}`}
									>
										<TagsIcon />
										<span className="text-sm">
											{__('Tags', 'doublescale')}
										</span>
									</button>
								</div>
							</div>

							<div className="relative mt-3">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									placeholder={
										activeTab === 'lists'
											? __('Search by list...', 'doublescale')
											: __('Search by tag...', 'doublescale')
									}
									className="h-9 pl-9"
								/>
							</div>

							<div
								ref={optionsContainerRef}
								className="mt-3 max-h-[260px] overflow-y-auto rounded-lg border border-border"
								onScroll={handleOptionsScroll}
							>
								<button
									type="button"
									className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40"
									onClick={toggleSelectAllInActiveTab}
								>
									<Checkbox checked={allActiveSelected} />
									<span>
										{allActiveSelected
											? __('Unselect all options', 'doublescale')
											: __('Select all options', 'doublescale')}{' '}
										({selectedInActiveTab.length}/{activeItems.length})
									</span>
								</button>

								{activeItems.length === 0 &&
									!(activeTab === 'lists' ? loadingLists : loadingTags) ? (
									<div className="px-3 py-4 text-sm text-muted-foreground">
										{__('No results found.', 'doublescale')}
									</div>
								) : (
									activeItems.map((item) => {
										const itemId = String(item.id);
										const checked = selectedInActiveTab.includes(itemId);
										return (
											<button
												key={`${activeTab}-${itemId}`}
												type="button"
												className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
												onClick={() =>
													activeTab === 'lists'
														? handleToggleList(itemId)
														: handleToggleTag(itemId)
												}
											>
												<Checkbox checked={checked} />
												<span className="flex min-w-0 flex-1 items-center justify-between gap-2">
													<span className="truncate">{item.name}</span>
													{typeof getItemRecipientCount(item) ===
														'number' && (
														<span className="shrink-0 text-xs text-muted-foreground">
															{getItemRecipientCount(
																item
															)?.toLocaleString()}
														</span>
													)}
												</span>
											</button>
										);
									})
								)}

								{((activeTab === 'lists' && loadingLists) ||
									(activeTab === 'tags' && loadingTags)) && (
										<div className="flex items-center justify-center gap-2 border-t border-border px-3 py-2 text-sm text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span>{__('Loading more...', 'doublescale')}</span>
										</div>
									)}
							</div>
						</PopoverContent>
					</Popover>
				</CardContent>
			</Card>
		</div>
	);
});
