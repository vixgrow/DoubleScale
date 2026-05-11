import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { useRef, useState, useEffect } from 'react';
import Filters from '@/components/filters';
import type { Filter as FilterType } from '@doublescale/client';
import { DeleteIcon } from '@/components/icons';

interface FilterBlock {
	id: string;
	filters: FilterType[];
}

interface AdvancedFilterProps {
	filters: FilterType[];
	setFilters: (filters: FilterType[]) => void;
	fetchContacts: () => Promise<void>;
	loading: boolean;
	onApplyingChange?: (isApplying: boolean) => void;
}

export default function AdvancedFilter({
	filters,
	setFilters,
	fetchContacts,
	loading,
	onApplyingChange,
}: AdvancedFilterProps) {
	const filtersRef = useRef<HTMLDivElement>(null);
	const [filterBlocks, setFilterBlocks] = useState<FilterBlock[]>([
		{ id: '1', filters: [] },
	]);

	// Initialize filter blocks with incoming filters
	useEffect(() => {
		if (filters.length > 0) {
			setFilterBlocks([{ id: '1', filters: filters }]);
		}
	}, []);

	// Function to handle adding a new filter block
	const handleAddFilter = () => {
		const newBlock: FilterBlock = {
			id: Date.now().toString(),
			filters: [],
		};
		setFilterBlocks([...filterBlocks, newBlock]);
	};

	// Function to update a specific filter block
	const updateFilterBlock = (blockId: string, newFilters: FilterType[]) => {
		setFilterBlocks((prev) =>
			prev.map((block) =>
				block.id === blockId ? { ...block, filters: newFilters } : block
			)
		);

		// Update the main filters array with all filters from all blocks
		const allFilters = filterBlocks.reduce((acc, block) => {
			if (block.id === blockId) {
				return [...acc, ...newFilters];
			}
			return [...acc, ...block.filters];
		}, [] as FilterType[]);

		setFilters(allFilters);
	};

	// Function to remove a filter block
	const removeFilterBlock = (blockId: string) => {
		const updatedBlocks = filterBlocks.filter(
			(block) => block.id !== blockId
		);
		setFilterBlocks(updatedBlocks);

		// Update the main filters array
		const allFilters = updatedBlocks.reduce((acc, block) => {
			return [...acc, ...block.filters];
		}, [] as FilterType[]);

		setFilters(allFilters);
	};

	// Function to handle clearing all filters
	const handleClearFilters = async () => {
		if (onApplyingChange) onApplyingChange(true);
		setFilterBlocks([{ id: '1', filters: [] }]);
		setFilters([]);
		// Fetch contacts after clearing filters
		await fetchContacts();
		if (onApplyingChange) onApplyingChange(false);
	};

	// Function to handle applying filters
	const handleApplyFilters = async () => {
		if (onApplyingChange) onApplyingChange(true);
		await fetchContacts();
		if (onApplyingChange) onApplyingChange(false);
	};

	return (
		<div className="space-y-6">
			<div ref={filtersRef} className="space-y-4">
				{filterBlocks.map((block, index) => (
					<div key={block.id} className="relative">
						{index > 0 && (
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-bold text-gray-600">
									{__('OR', 'doublescale')}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => removeFilterBlock(block.id)}
									className="text-red-600 hover:text-red-800 hover:bg-red-50"
								>
									<DeleteIcon width={20} height={20} />
								</Button>
							</div>
						)}
						<Filters
							filters={block.filters}
							onChange={(newFilters) =>
								updateFilterBlock(block.id, newFilters)
							}
						/>
					</div>
				))}
			</div>

			<div className="flex gap-2">
				<Button variant="default" onClick={handleAddFilter}>
					{__('Add Filter', 'doublescale')}
				</Button>
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
					disabled={loading}
				>
					{__('Clear Filters', 'doublescale')}
				</Button>
			</div>
		</div>
	);
}
