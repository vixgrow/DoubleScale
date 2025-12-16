import { __ } from '@wordpress/i18n';
import { ContactFilterSection } from '../contact-filter';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect } from 'react';
import type { Filter as FilterType } from '@quillcrm/client';

interface ListTagFilterProps {
	filters?: FilterType[];
	setFilters?: (filters: FilterType[]) => void;
	fetchContacts?: () => Promise<void>;
	loading?: boolean;
	onApplyingChange?: (isApplying: boolean) => void;
	showBtns?: boolean;
}

export default function ListTagFilter({
	filters = [],
	setFilters,
	fetchContacts,
	loading = false,
	onApplyingChange,
	showBtns = true,
}: ListTagFilterProps) {
	// Create refs to access the ContactFilterSection components
	const includeFilterRef = useRef<{ resetFilters: () => void } | null>(null);
	const excludeFilterRef = useRef<{ resetFilters: () => void } | null>(null);
	const [isApplying, setIsApplying] = useState(false);
	const [includeData, setIncludeData] = useState<any[]>([]);
	const [excludeData, setExcludeData] = useState<any[]>([]);

	// Initialize internal state from existing filters
	useEffect(() => {
		if (!filters || filters.length === 0) {
			return;
		}

		if (includeData.length > 0 || excludeData.length > 0) {
			return;
		}

		// Separate filters by type and operator
		const includeLists = new Set<string>();
		const includeTags = new Set<string>();
		const excludeLists = new Set<string>();
		const excludeTags = new Set<string>();

		filters.forEach((filter) => {
			if (filter.group !== 'segments') return;

			const value = filter.value?.[0];
			if (!value) return;

			const isInclude = filter.operator === 'contains';

			if (filter.filter === 'lists_segment') {
				if (isInclude) {
					includeLists.add(value.toString());
				} else {
					excludeLists.add(value.toString());
				}
			} else if (filter.filter === 'tags_segment') {
				if (isInclude) {
					includeTags.add(value.toString());
				} else {
					excludeTags.add(value.toString());
				}
			}
		});

		// Create rows from the collected lists and tags
		const includeRows: any[] = [];
		const excludeRows: any[] = [];

		// For include: create rows for each list/tag combination
		const maxInclude = Math.max(includeLists.size, includeTags.size, 1);
		const includeListsArray = Array.from(includeLists);
		const includeTagsArray = Array.from(includeTags);

		for (let i = 0; i < maxInclude; i++) {
			includeRows.push({
				id: Date.now() + i,
				list: includeListsArray[i] || 'all',
				tag: includeTagsArray[i] || 'all',
			});
		}

		// For exclude: create rows for each list/tag combination
		const maxExclude = Math.max(excludeLists.size, excludeTags.size);
		const excludeListsArray = Array.from(excludeLists);
		const excludeTagsArray = Array.from(excludeTags);

		for (let i = 0; i < maxExclude; i++) {
			excludeRows.push({
				id: Date.now() + maxInclude + i,
				list: excludeListsArray[i] || 'all',
				tag: excludeTagsArray[i] || 'all',
			});
		}

		setIncludeData(includeRows);
		setExcludeData(excludeRows);
	}, [filters, includeData.length, excludeData.length]);

	// Convert ContactFilterSection data to Filter objects when data changes
	useEffect(() => {
		const newFilters: FilterType[] = [];

		// Add include filters (lists and tags)
		includeData.forEach((row) => {
			if (row.list && row.list !== 'all') {
				const listId = parseInt(row.list);
				if (!isNaN(listId)) {
					newFilters.push({
						group: 'segments',
						filter: 'lists_segment',
						operator: 'contains',
						value: [listId],
					});
				}
			}
			if (row.tag && row.tag !== 'all') {
				const tagId = parseInt(row.tag);
				if (!isNaN(tagId)) {
					newFilters.push({
						group: 'segments',
						filter: 'tags_segment',
						operator: 'contains',
						value: [tagId],
					});
				}
			}
		});

		// Add exclude filters (lists and tags with 'does_not_contain' operator)
		excludeData.forEach((row) => {
			if (row.list && row.list !== 'all') {
				const listId = parseInt(row.list);
				if (!isNaN(listId)) {
					newFilters.push({
						group: 'segments',
						filter: 'lists_segment',
						operator: 'does_not_contain',
						value: [listId],
					});
				}
			}
			if (row.tag && row.tag !== 'all') {
				const tagId = parseInt(row.tag);
				if (!isNaN(tagId)) {
					newFilters.push({
						group: 'segments',
						filter: 'tags_segment',
						operator: 'does_not_contain',
						value: [tagId],
					});
				}
			}
		});

		// Only update if filters have changed
		if (
			setFilters &&
			JSON.stringify(newFilters) !== JSON.stringify(filters)
		) {
			setFilters(newFilters);
		}
	}, [includeData, excludeData, setFilters, filters]);

	// Function to handle clearing all filters
	const handleClearFilters = async () => {
		if (onApplyingChange) onApplyingChange(true);
		setIsApplying(true);

		// Reset include filter section
		if (includeFilterRef.current && includeFilterRef.current.resetFilters) {
			includeFilterRef.current.resetFilters();
		}

		// Reset exclude filter section
		if (excludeFilterRef.current && excludeFilterRef.current.resetFilters) {
			excludeFilterRef.current.resetFilters();
		}

		// Clear local state
		setIncludeData([]);
		setExcludeData([]);

		// Clear filters in campaign settings
		if (setFilters) {
			setFilters([]);
		}

		// Fetch contacts after clearing
		if (fetchContacts) {
			await fetchContacts();
		}

		setIsApplying(false);
		if (onApplyingChange) onApplyingChange(false);
	};

	// Function to handle applying filters
	const handleApplyFilters = async () => {
		if (onApplyingChange) onApplyingChange(true);
		setIsApplying(true);

		if (fetchContacts) {
			await fetchContacts();
		}

		setIsApplying(false);
		if (onApplyingChange) onApplyingChange(false);
	};

	return (
		<div className="space-y-6">
			<ContactFilterSection
				title="Included Contacts"
				description="Select List and Tags that you want to send emails for this campaign. You can create multiple row to send to all of them."
				ref={includeFilterRef}
				onChange={setIncludeData}
				initialRows={includeData.length ? includeData : undefined}
			/>
			<div className="border-t border-gray-200"></div>
			<ContactFilterSection
				title="Exclude Contacts"
				description="Select List and Tags that you want to Exclude from this campaign. Exclude contacts will be subtracted from your included selection."
				ref={excludeFilterRef}
				onChange={setExcludeData}
				initialRows={excludeData.length > 0 ? excludeData : []}
			/>

			<div className="border-t border-gray-200"></div>

			{showBtns && (
				<div className="flex gap-2">
					<Button
						variant="secondaryDeepBlue"
						onClick={handleApplyFilters}
						disabled={loading}
					>
						{__('Apply Filters', 'quillcrm')}
					</Button>
					<Button
						variant="destructive"
						onClick={handleClearFilters}
						disabled={loading || isApplying}
					>
						{__('Clear Filters', 'quillcrm')}
					</Button>
				</div>
			)}
		</div>
	);
}
