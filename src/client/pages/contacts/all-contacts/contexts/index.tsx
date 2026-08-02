/**
 * external dependencies
 */
import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	ReactNode,
} from 'react';
/**
 * DoubleScale dependencies
 */
import { useNavigate, useLocation, getToLink } from '@doublescale/navigation';
import {
	getListPreferences,
	parseSavedDateRange,
	parseSavedSort,
	serializeDateRange,
} from '@doublescale/services/list-preferences-service';
import { useListPreferencesPersistence } from '@doublescale/hooks/use-list-preferences';
/**
 * internal dependencies
 */
import type {
	Contact,
	Filter as FilterType,
	NoticeMessage,
	ServerSortState,
} from '@doublescale/client';
import { parseContactsDeepLinkFilters } from '../../deep-link-filters';

/**
 * Columns the contacts list can be sorted by.
 *
 * Mirrors RestContactController::SORTABLE_COLUMNS. Note contacts have
 * channel-specific status columns rather than a single `status`.
 */
export const CONTACT_SORTABLE_COLUMNS = [
	'first_name',
	'last_name',
	'email',
	'phone',
	'city',
	'country',
	'email_status',
	'sms_status',
	'created_at',
	'updated_at',
] as const;

export interface ContactsState {
	// Data state
	loading: boolean;
	data: Contact[];
	total: number;
	page: number;
	sort: ServerSortState | null;
	perPage: number;
	keywords: string;
	totalRecords: number;
	hasRecords: boolean;

	// Filter state
	showFilters: boolean;
	filters: FilterType[];
	isFiltering: boolean;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};

	// Selection state
	selectedRowKeys: React.Key[];
	selectedLists: string[];
	selectedTags: string[];
	bulkAction: string;
	isApplying: boolean;

	// Modal state
	createContactVisible: boolean;
	importModalVisible: boolean;
	exportModalVisible: boolean;
	isSaving: boolean;

	// Notice state
	notice: NoticeMessage | null;
}

export interface ContactsActions {
	// Data actions
	setLoading: (loading: boolean) => void;
	setData: (data: Contact[]) => void;
	setTotal: (total: number) => void;
	setPage: (page: number) => void;
	setSort: (sort: ServerSortState | null) => void;
	setPerPage: (perPage: number) => void;
	setKeywords: (keywords: string) => void;
	setTotalRecords: (totalRecords: number) => void;
	setHasRecords: (hasRecords: boolean) => void;

	// Filter actions
	setShowFilters: (show: boolean) => void;
	setFilters: (filters: FilterType[]) => void;
	setIsFiltering: (filtering: boolean) => void;
	setDateRange: (range: { from: Date | null; to: Date | null }) => void;

	// Selection actions
	setSelectedRowKeys: (keys: React.Key[]) => void;
	setSelectedLists: (lists: string[]) => void;
	setSelectedTags: (tags: string[]) => void;
	setBulkAction: (action: string) => void;
	setIsApplying: (applying: boolean) => void;

	// Modal actions
	setCreateContactVisible: (visible: boolean) => void;
	setImportModalVisible: (visible: boolean) => void;
	setExportModalVisible: (visible: boolean) => void;
	setIsSaving: (saving: boolean) => void;

	// Contact navigation actions
	openContactDialog: (id: string) => void;

	// Notice actions
	setNotice: (notice: NoticeMessage | null) => void;
	showNotice: (type: 'success' | 'error', message: string) => void;
	closeNotice: () => void;
}

function buildContactsInitialState(): ContactsState {
	const saved = getListPreferences('contacts');
	const deepLinkFilters = parseContactsDeepLinkFilters();

	return {
		loading: true,
		data: [],
		total: 0,
		// A deep link (list_id / tag_id) applies its own filters, so the saved
		// page belongs to a different result set — start at the top instead.
		page: deepLinkFilters ? 1 : saved.page ?? 1,
		sort: parseSavedSort(saved.sort, CONTACT_SORTABLE_COLUMNS),
		perPage: saved.per_page ?? 10,
		keywords: saved.keyword ?? '',
		totalRecords: 0,
		hasRecords: false,
		showFilters: saved.show_filters ?? false,
		// Deep link from Lists/Tags: open Contacts already filtered.
		filters: (deepLinkFilters as unknown as FilterType[]) ?? [],
		isFiltering: false,
		dateRange: parseSavedDateRange(saved.date_range),
		selectedRowKeys: [],
		selectedLists: [],
		selectedTags: [],
		bulkAction: '',
		isApplying: false,
		createContactVisible: false,
		importModalVisible: false,
		exportModalVisible: false,
		isSaving: false,
		notice: null,
	};
}

const ContactsContext = createContext<
	(ContactsState & ContactsActions) | undefined
>(undefined);

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [state, setState] = useState<ContactsState>(buildContactsInitialState);
	const navigate = useNavigate();
	const location = useLocation();

	const updateState = (updates: Partial<ContactsState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	// Keep Contacts filters in sync when arriving via list_id / tag_id deep links.
	useEffect(() => {
		const deepLinkFilters = parseContactsDeepLinkFilters(location.search);
		if (!deepLinkFilters) {
			return;
		}
		setState((prev) => {
			if (
				JSON.stringify(prev.filters) ===
				JSON.stringify(deepLinkFilters)
			) {
				return prev;
			}
			return {
				...prev,
				filters: deepLinkFilters as unknown as FilterType[],
				page: 1,
			};
		});
	}, [location.search]);

	const actions: ContactsActions = {
		setLoading: (loading) => updateState({ loading }),
		setData: (data) => updateState({ data }),
		setTotal: (total) => updateState({ total }),
		setPage: (page) => updateState({ page }),
		// Re-sorting reorders the whole result set server-side, so the current
		// page number no longer points at the same rows.
		setSort: (sort) => updateState({ sort, page: 1 }),
		setPerPage: (perPage) => updateState({ perPage }),
		// Changing a filter narrows the result set, so the current page number no
		// longer refers to the same rows — go back to the first page.
		setKeywords: (keywords) => updateState({ keywords, page: 1 }),
		setTotalRecords: (totalRecords) => updateState({ totalRecords }),
		setHasRecords: (hasRecords) => updateState({ hasRecords }),
		setShowFilters: (showFilters) => updateState({ showFilters }),
		setFilters: (filters) => updateState({ filters, page: 1 }),
		setIsFiltering: (isFiltering) => updateState({ isFiltering }),
		setDateRange: (dateRange) => updateState({ dateRange, page: 1 }),
		setSelectedRowKeys: (selectedRowKeys) =>
			updateState({ selectedRowKeys }),
		setSelectedLists: (selectedLists) => updateState({ selectedLists }),
		setSelectedTags: (selectedTags) => updateState({ selectedTags }),
		setBulkAction: (bulkAction) => updateState({ bulkAction }),
		setIsApplying: (isApplying) => updateState({ isApplying }),
		setCreateContactVisible: (createContactVisible) =>
			updateState({ createContactVisible }),
		setImportModalVisible: (importModalVisible) =>
			updateState({ importModalVisible }),
		setExportModalVisible: (exportModalVisible) =>
			updateState({ exportModalVisible }),
		setIsSaving: (isSaving) => updateState({ isSaving }),
		openContactDialog: (id) => {
			// Navigate to the contact page with the ID in the URL
			navigate(getToLink(`contacts/${id}`));
		},
		setNotice: (notice) => updateState({ notice }),
		showNotice: (type, message) =>
			updateState({ notice: { type, message } }),
		closeNotice: () => updateState({ notice: null }),
	};

	const value = { ...state, ...actions };

	const persistenceValues = useMemo(
		() => ({
			page: state.page,
			sort: state.sort,
			per_page: state.perPage,
			show_filters: state.showFilters,
			keyword: state.keywords,
			date_range: serializeDateRange(state.dateRange),
		}),
		[
			state.dateRange,
			state.keywords,
			state.page,
			state.sort,
			state.perPage,
			state.showFilters,
		]
	);

	useListPreferencesPersistence('contacts', persistenceValues);

	return (
		<ContactsContext.Provider value={value}>
			{children}
		</ContactsContext.Provider>
	);
};

export const useContactsContext = () => {
	const context = useContext(ContactsContext);
	if (!context) {
		throw new Error(
			'useContactsContext must be used within ContactsProvider'
		);
	}
	return context;
};
