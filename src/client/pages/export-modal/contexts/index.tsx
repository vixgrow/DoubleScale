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
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';
/**
 * internal dependencies
 */
import type { ContactsResponse } from '@doublescale/client';
import type { RuleItem } from '@/components/rules-builder';
import { getFilteredRulesGroups, getInitialRule } from '@/utils';

/** Stable JSON key for nested rules (count refetch + change detection). */
const serializeRules = (input: Array<Array<RuleItem>>): string =>
	JSON.stringify(input ?? []);

interface ExportContextType {
	// State
	selectedFields: string[];
	offset: number;
	total: number;
	loading: boolean;
	rules: Array<Array<RuleItem>>;
	rulesGroups: any;
	isFiltering: boolean;
	totalContact: number;

	// Actions
	setSelectedFields: (fields: string[]) => void;
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
	const [isFiltering, setIsFiltering] = useState(false);
	const [totalContact, setTotalContact] = useState(0);
	const { createNotice } = useDispatch('doublescale/core');

	// Rules builder setup (non-automation context)
	const rulesGroups = getFilteredRulesGroups(false);
	const [rules, setRules] = useState<Array<Array<RuleItem>>>([
		[getInitialRule(rulesGroups)],
	]);
	const rulesRef = useRef(rules);
	rulesRef.current = rules;
	const fetchGenerationRef = useRef(0);

	/** Deep-clone so RulesBuilder in-place nested edits cannot alias prior state. */
	const updateRules = useCallback((next: Array<Array<RuleItem>>) => {
		setRules(JSON.parse(JSON.stringify(next ?? [])) as Array<Array<RuleItem>>);
	}, []);

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
					// Backend Contact_Filters_Process accepts nested RuleItem rows.
					filters: rulesRef.current,
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
		fetchGenerationRef.current += 1;
		setOffset(0);
		setLoading(false);
		setSelectedFields(['first_name', 'last_name', 'email']);
		setRules([[getInitialRule(rulesGroups)]]);
		setTotalContact(0);
		setTotal(0);
		setIsFiltering(false);
		onClose();
	};

	const fetchContacts = useCallback(
		async (filtersToApply: Array<Array<RuleItem>>) => {
			const generation = ++fetchGenerationRef.current;
			setIsFiltering(true);
			try {
				const response = (await apiFetch({
					path: addQueryArgs('/doublescale/v1/contacts', {
						per_page: 1,
						page: 1,
						filters: filtersToApply,
					}),
					method: 'GET',
					parse: true,
				})) as ContactsResponse;

				if (generation !== fetchGenerationRef.current) {
					return;
				}

				// Laravel paginator `total` is the filtered match count.
				setTotalContact(response.total ?? 0);
			} catch (error) {
				if (generation !== fetchGenerationRef.current) {
					return;
				}
				createNotice({
					type: 'error',
					message: __('Failed to fetch contacts', 'doublescale'),
				});
			} finally {
				if (generation === fetchGenerationRef.current) {
					setIsFiltering(false);
				}
			}
		},
		[createNotice]
	);

	const toggleField = (field: string) => {
		if (selectedFields.includes(field)) {
			setSelectedFields(selectedFields.filter((f) => f !== field));
		} else {
			setSelectedFields([...selectedFields, field]);
		}
	};

	// Refetch count whenever the modal is open and rules change.
	// RulesBuilder often mutates nested arrays in place; serialize so we still
	// detect value edits and never share a live reference with fetch/export.
	const rulesKey = serializeRules(rules);
	useEffect(() => {
		if (!open) {
			return;
		}
		const filtersSnapshot = JSON.parse(rulesKey) as Array<
			Array<RuleItem>
		>;
		void fetchContacts(filtersSnapshot);
	}, [open, rulesKey, fetchContacts]);

	const contextValue: ExportContextType = {
		selectedFields,
		offset,
		total,
		loading,
		rules,
		rulesGroups,
		isFiltering,
		totalContact,
		setSelectedFields,
		setRules: updateRules,
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
