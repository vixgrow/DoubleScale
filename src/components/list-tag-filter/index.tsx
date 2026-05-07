import { __ } from '@wordpress/i18n';
import { ContactFilterSection } from '../contact-filter';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect } from 'react';

interface ListTagFilterProps {
	// Nested filters array: [includeRows[], excludeRows[]]
	// Each row is a plain object from ContactFilterSection (e.g. { id, list, tag })
	filters?: any[][];
	setFilters?: (filters: any[][]) => void;
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
	const [includeData, setIncludeData] = useState<any[]>(
		Array.isArray(filters?.[0]) ? (filters?.[0] as any[]) : []
	);
	const [excludeData, setExcludeData] = useState<any[]>(
		Array.isArray(filters?.[1]) ? (filters?.[1] as any[]) : []
	);

	// Keep local state in sync when filters prop changes (but without any mapping)
	useEffect(() => {
		if (!Array.isArray(filters)) {
			return;
		}

		const nextInclude = Array.isArray(filters[0])
			? (filters[0] as any[])
			: [];
		const nextExclude = Array.isArray(filters[1])
			? (filters[1] as any[])
			: [];

		setIncludeData(nextInclude);
		setExcludeData(nextExclude);
	}, [filters]);

	// Whenever local rows change, push them up as a nested array
	useEffect(() => {
		if (!setFilters) return;

		const nextFilters: any[][] = [includeData, excludeData];

		if (JSON.stringify(nextFilters) !== JSON.stringify(filters)) {
			setFilters(nextFilters);
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

		// Clear filters in campaign settings (nested array)
		if (setFilters) {
			setFilters([[], []]);
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
						{__('Apply Filters', 'doublescale')}
					</Button>
					<Button
						variant="destructive"
						onClick={handleClearFilters}
						disabled={loading || isApplying}
					>
						{__('Clear Filters', 'doublescale')}
					</Button>
				</div>
			)}
		</div>
	);
}
