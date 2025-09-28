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
}

export default function ListTagFilter({
	filters = [],
	setFilters,
	fetchContacts,
	loading = false,
	onApplyingChange,
}: ListTagFilterProps) {
	// Create refs to access the ContactFilterSection components
	const includeFilterRef = useRef<{ resetFilters: () => void } | null>(null);
	const excludeFilterRef = useRef<{ resetFilters: () => void } | null>(null);
	const [isApplying, setIsApplying] = useState(false);
	const [includeData, setIncludeData] = useState<any[]>([]);
	const [excludeData, setExcludeData] = useState<any[]>([]);

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
			/>
			<div className="border-t border-gray-200"></div>
			<ContactFilterSection
				title="Exclude Contacts"
				description="Select List and Tags that you want to Exclude from this campaign. Exclude contacts will be subtracted from your included selection."
				ref={excludeFilterRef}
				onChange={setExcludeData}
			/>

			<div className="border-t border-gray-200"></div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					onClick={handleApplyFilters}
					disabled={loading || isApplying}
				>
					{__('Apply Filters', 'quillcrm')}
				</Button>
				<Button
					variant="secondaryDeepBlue"
					onClick={handleClearFilters}
					disabled={loading || isApplying}
				>
					{__('Clear Filters', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
}
