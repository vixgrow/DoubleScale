/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import { createContext, useContext, useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import type { Filter as FilterType, ContactsResponse } from '@doublescale/client';
import type { RuleItem } from '@/components/rules-builder';
import { getFilteredRulesGroups, getInitialRule } from '@/utils';

interface ExportContextType {
	// State
	selectedFields: string[];
	offset: number;
	total: number;
	loading: boolean;
	filters: FilterType[] | any;
	rules: Array<Array<RuleItem>>;
	rulesGroups: any;
	isFiltering: boolean;
	totalContact: number;

	// Actions
	setSelectedFields: (fields: string[]) => void;
	setFilters: (filters: FilterType[]) => void;
	setRules: (rules: Array<Array<RuleItem>>) => void;
	handleExport: () => Promise<void>;
	handleClose: () => void;
	toggleField: (field: string) => void;
}

const ExportContext = createContext<ExportContextType | null>(null);

export const useExportContext = () => {
	const context = useContext(ExportContext);
	if (!context) {
		throw new Error('useExportContext must be used within ExportProvider');
	}
	return context;
};

interface ExportProviderProps {
	children: React.ReactNode;
	onClose: () => void;
	open: boolean;
}

export const ExportProvider: React.FC<ExportProviderProps> = ({
	children,
	onClose,
	open,
}) => {
	const [selectedFields, setSelectedFields] = useState<string[]>([
		'first_name',
		'last_name',
		'email',
	]);
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<FilterType[] | any>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [totalContact, setTotalContact] = useState(0);
	const { createNotice } = useDispatch('doublescale/core');

	// Rules builder setup (non-automation context)
	const rulesGroups = getFilteredRulesGroups(false);
	const [rules, setRules] = useState<Array<Array<RuleItem>>>([
		[getInitialRule(rulesGroups)],
	]);

	// Sync rules to filters when rules change
	useEffect(() => {
		// Only update if filters actually changed to avoid infinite loops
		if (JSON.stringify(rules) !== JSON.stringify(filters)) {
			setFilters(rules);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rules]);

	const handleExport = async (currentOffset = 0, file = '') => {
		if (selectedFields.length === 0 || loading) {
			return;
		}
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/import-export/export'),
				method: 'POST',
				data: {
					fields: selectedFields,
					offset: currentOffset,
					file_id: file,
					filters: filters,
				},
			})) as {
				offset: number;
				file_id: string;
				status: string;
				total: number;
			};

			setTotal(response.total);
			setOffset(response.offset);

			if (response.status === 'in_progress') {
				setTimeout(
					() => handleExport(response.offset, response.file_id),
					1000
				);
			} else {
				await downloadFile(response.file_id);
				handleClose();
			}
		} catch (error) {
			setLoading(false);
			createNotice({
				type: 'error',
				message: __('Export failed', 'doublescale'),
			});
		}
	};

	const downloadFile = async (fileId: string) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/import-export/download', {
					file_id: fileId,
				}),
				method: 'GET',
				parse: false,
			})) as Response;

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			const fileName = `doublescale-contacts-${fileId}.csv`;
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Download failed', 'doublescale'),
			});
		}
	};

	const handleClose = () => {
		setOffset(0);
		setLoading(false);
		setSelectedFields(['first_name', 'last_name', 'email']);
		setFilters([]);
		setRules([[getInitialRule(rulesGroups)]]);
		setTotalContact(0);
		setTotal(0);
		setIsFiltering(false);
		onClose();
	};

	const fetchContacts = async () => {
		setIsFiltering(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/contacts', {
					per_page: 1,
					page: 1,
					filters: filters,
				}),
				method: 'GET',
				parse: true,
			})) as ContactsResponse;

			setTotalContact(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'doublescale'),
			});
		} finally {
			setIsFiltering(false);
		}
	};

	const toggleField = (field: string) => {
		if (selectedFields.includes(field)) {
			setSelectedFields(selectedFields.filter((f) => f !== field));
		} else {
			setSelectedFields([...selectedFields, field]);
		}
	};

	useEffect(() => {
		if (open) {
			fetchContacts();
		}
	}, [open, filters]);

	const contextValue: ExportContextType = {
		selectedFields,
		offset,
		total,
		loading,
		filters,
		rules,
		rulesGroups,
		isFiltering,
		totalContact,
		setSelectedFields,
		setFilters,
		setRules,
		handleExport,
		handleClose,
		toggleField,
	};

	return (
		<ExportContext.Provider value={contextValue}>
			{children}
		</ExportContext.Provider>
	);
};
