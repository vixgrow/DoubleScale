/**
 * external dependencies
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
/**
 * QuillCRM dependencies
 */
import { useNavigate, getToLink } from '@quillcrm/navigation';
/**
 * internal dependencies
 */
import type {
	Contact,
	Filter as FilterType,
	NoticeMessage,
} from '@quillcrm/client';

export interface ContactsState {
	// Data state
	loading: boolean;
	data: Contact[];
	total: number;
	page: number;
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
	contact: {
		email: string;
		first_name: string;
		last_name: string;
	};

	// Notice state
	notice: NoticeMessage | null;
}

export interface ContactsActions {
	// Data actions
	setLoading: (loading: boolean) => void;
	setData: (data: Contact[]) => void;
	setTotal: (total: number) => void;
	setPage: (page: number) => void;
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
	setContact: (contact: ContactsState['contact']) => void;

	// Contact navigation actions
	openContactDialog: (id: string) => void;

	// Notice actions
	setNotice: (notice: NoticeMessage | null) => void;
	showNotice: (type: 'success' | 'error', message: string) => void;
	closeNotice: () => void;
}

const initialState: ContactsState = {
	loading: true,
	data: [],
	total: 0,
	page: 1,
	perPage: 10,
	keywords: '',
	totalRecords: 0,
	hasRecords: false,
	showFilters: false,
	filters: [],
	isFiltering: false,
	dateRange: { from: null, to: null },
	selectedRowKeys: [],
	selectedLists: [],
	selectedTags: [],
	bulkAction: '',
	isApplying: false,
	createContactVisible: false,
	importModalVisible: false,
	exportModalVisible: false,
	isSaving: false,
	contact: { email: '', first_name: '', last_name: '' },
	notice: null,
};

const ContactsContext = createContext<
	(ContactsState & ContactsActions) | undefined
>(undefined);

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [state, setState] = useState<ContactsState>(initialState);
	const navigate = useNavigate();

	const updateState = (updates: Partial<ContactsState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	const actions: ContactsActions = {
		setLoading: (loading) => updateState({ loading }),
		setData: (data) => updateState({ data }),
		setTotal: (total) => updateState({ total }),
		setPage: (page) => updateState({ page }),
		setPerPage: (perPage) => updateState({ perPage }),
		setKeywords: (keywords) => updateState({ keywords }),
		setTotalRecords: (totalRecords) => updateState({ totalRecords }),
		setHasRecords: (hasRecords) => updateState({ hasRecords }),
		setShowFilters: (showFilters) => updateState({ showFilters }),
		setFilters: (filters) => updateState({ filters }),
		setIsFiltering: (isFiltering) => updateState({ isFiltering }),
		setDateRange: (dateRange) => updateState({ dateRange }),
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
		setContact: (contact) => updateState({ contact }),
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
