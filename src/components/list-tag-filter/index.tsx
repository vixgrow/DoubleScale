import { __ } from '@wordpress/i18n';
import { ContactFilterSection } from '../contact-filter';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect, useMemo } from 'react';

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

	// Parent rebuilds the `filters` array on every render even when its
	// contents are stable; compare by content signature so we only re-sync
	// local state when the upstream rows actually change.
	const filtersSignature = useMemo(() => JSON.stringify(filters ?? []), [filters]);
	const localSignature = useMemo(
		() => JSON.stringify([includeData, excludeData]),
		[includeData, excludeData]
	);

	useEffect(() => {
		if (!Array.isArray(filters)) {
			return;
		}
		// Skip the sync when local state already matches — avoids reassigning
		// new array references for the same content (which would re-trigger
		// the downstream onChange loop).
		if (filtersSignature === localSignature) {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps -- signature already encodes filters content
	}, [filtersSignature]);

	// Whenever local rows change, push them up as a nested array
	useEffect(() => {
		if (!setFilters) return;

		if (filtersSignature === localSignature) {
			return;
		}

		setFilters([includeData, excludeData]);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- signatures encode the relevant state
	}, [localSignature]);

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

		// Let parent settings state flush before requesting contacts.
		await Promise.resolve();

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

		// Ensure parent/store gets the latest local selections before fetching.
		if (setFilters) {
			setFilters([includeData, excludeData]);
		}

		// Let parent settings state flush before requesting contacts.
		await Promise.resolve();

		if (fetchContacts) {
			await fetchContacts();
		}

		setIsApplying(false);
		if (onApplyingChange) onApplyingChange(false);
	};

	return (
		<div className="space-y-6 border border-border bg-white rounded-xl p-6">
			<ContactFilterSection
				title="Included Contacts"
				description="Select List and Tags that you want to send emails for this campaign. You can create multiple row to send to all of them."
				ref={includeFilterRef}
				onChange={setIncludeData}
				initialRows={includeData}
			/>
			<div className="border-t border-border"></div>
			<ContactFilterSection
				title="Exclude Contacts"
				description="Select List and Tags that you want to Exclude from this campaign. Exclude contacts will be subtracted from your included selection."
				ref={excludeFilterRef}
				onChange={setExcludeData}
				initialRows={excludeData.length > 0 ? excludeData : []}
			/>

			{showBtns && (
				<div className="flex gap-6 justify-end">	
					<Button
						variant="destructive"
						onClick={handleClearFilters}
						disabled={loading || isApplying}
						className="bg-white text-destructive border border-destructive hover:text-white"
					>
						{__('Clear Filters', 'doublescale')}
					</Button>
					<Button
						variant="secondary"
						onClick={handleApplyFilters}
						disabled={loading}
						className="bg-white"
					>
						{__('Apply Filters', 'doublescale')}
					</Button>
				</div>
			)}
		</div>
	);
}
