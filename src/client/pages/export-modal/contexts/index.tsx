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
import type { Filter as FilterType, ContactsResponse } from '@quillcrm/client';
import type { RuleItem } from '@/components/rules-builder';
import ConfigAPI from '@quillcrm/config';

interface ExportContextType {
	// State
	selectedFields: string[];
	offset: number;
	total: number;
	loading: boolean;
	filters: FilterType[];
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
	const [filters, setFilters] = useState<FilterType[]>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [totalContact, setTotalContact] = useState(0);
	const { createNotice } = useDispatch('quillcrm/core');

	// Rules builder setup
	const allRulesGroups = ConfigAPI.getAutomationRules();
	// Filter out disabled groups
	const rulesGroups = Object.keys(allRulesGroups).reduce((acc, key) => {
		if (!allRulesGroups[key].is_disabled) {
			acc[key] = allRulesGroups[key];
		}
		return acc;
	}, {} as any);

	const firstGroup = Object.keys(rulesGroups)[0];
	const firstRule = firstGroup
		? Object.keys(rulesGroups[firstGroup].rules)[0]
		: '';
	const getInitialRule = (): RuleItem => ({
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup,
	});
	const [rules, setRules] = useState<Array<Array<RuleItem>>>([
		[getInitialRule()],
	]);

	// Convert RulesBuilder rules format to backend filters format
	// This is needed because fetchContacts and handleExport expect FilterType[]
	const mapRulesToFilters = (
		inputRules: Array<Array<RuleItem>>
	): FilterType[] => {
		const flat = (inputRules || []).reduce(
			(acc, group) => acc.concat(group || []),
			[] as RuleItem[]
		);
		return flat
			.filter((r) => r && r.rule)
			.map((r) => ({
				group: r.selectedGroup || '',
				filter: r.rule, // backend expects filter slug
				operator: r.operator || 'is',
				value: r.value ?? '',
			}));
	};

	// Sync rules to filters when rules change
	// This ensures fetchContacts and handleExport always have the latest filters
	useEffect(() => {
		const newFilters = mapRulesToFilters(rules);
		// Only update if filters actually changed to avoid infinite loops
		if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
			setFilters(newFilters);
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
				path: addQueryArgs('/qc/v1/import-export/export'),
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
				message: __('Export failed', 'quillcrm'),
			});
		}
	};

	const downloadFile = async (fileId: string) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/download', {
					file_id: fileId,
				}),
				method: 'GET',
				parse: false,
			})) as Response;

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			const fileName = `quillcrm-contacts-${fileId}.csv`;
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Download failed', 'quillcrm'),
			});
		}
	};

	const handleClose = () => {
		setOffset(0);
		setLoading(false);
		setSelectedFields(['first_name', 'last_name', 'email']);
		setFilters([]);
		setRules([[getInitialRule()]]);
		setTotalContact(0);
		setTotal(0);
		setIsFiltering(false);
		onClose();
	};

	const fetchContacts = async () => {
		setIsFiltering(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
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
				message: __('Failed to fetch contacts', 'quillcrm'),
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
