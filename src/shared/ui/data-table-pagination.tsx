/**
 * wordpress depnedencies
 */

/**
 * external dependencies
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * internal dependencies
 */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Mock table interface for demonstration
interface MockTable {
	getState: () => {
		pagination: {
			pageIndex: number;
			pageSize: number;
		};
	};
	getPageCount: () => number;
	getFilteredSelectedRowModel: () => { rows: any[] };
	getFilteredRowModel: () => { rows: any[] };
	setPageSize: (size: number) => void;
	setPageIndex: (index: number) => void;
	getCanPreviousPage: () => boolean;
	getCanNextPage: () => boolean;
	previousPage: () => void;
	nextPage: () => void;
}

interface DataTablePaginationProps<TData> {
	table: MockTable;
}

// Mock data for demonstration
const mockTable: MockTable = {
	getState: () => ({
		pagination: {
			pageIndex: 0, // Current page (0-indexed)
			pageSize: 10,
		},
	}),
	getPageCount: () => 85, // Total pages
	getFilteredSelectedRowModel: () => ({ rows: [] }),
	getFilteredRowModel: () => ({ rows: Array(843).fill({}) }), // Total 843 results
	setPageSize: (_size: number) => {},
	setPageIndex: (_index: number) => {},
	getCanPreviousPage: () => false, // First page
	getCanNextPage: () => true,
	previousPage: () => {},
	nextPage: () => {},
};

export default function DataTablePagination<TData>({
	table = mockTable,
}: DataTablePaginationProps<TData>) {
	const currentPage = table.getState().pagination.pageIndex + 1; // Convert to 1-indexed
	const totalPages = table.getPageCount();
	const pageSize = table.getState().pagination.pageSize;
	const totalResults = table.getFilteredRowModel().rows.length;

	// Calculate which page numbers to show
	const getVisiblePages = (): (number | string)[] => {
		const delta = 2; // Number of pages to show on each side of current page
		const range: number[] = [];
		const rangeWithDots: (number | string)[] = [];

		for (
			let i = Math.max(2, currentPage - delta);
			i <= Math.min(totalPages - 1, currentPage + delta);
			i++
		) {
			range.push(i);
		}

		if (currentPage - delta > 2) {
			rangeWithDots.push(1, '...');
		} else {
			rangeWithDots.push(1);
		}

		rangeWithDots.push(...range);

		if (currentPage + delta < totalPages - 1) {
			rangeWithDots.push('...', totalPages);
		} else if (totalPages > 1) {
			rangeWithDots.push(totalPages);
		}

		// Remove duplicates
		return rangeWithDots.filter(
			(item, index, arr) => index === 0 || item !== arr[index - 1]
		);
	};

	const visiblePages = getVisiblePages();
	return (
		<div className="flex max-sm:flex-col max-sm:gap-3 items-center justify-between border-t border-[#DEE1E6] px-4 pt-3">
			{/* Left side - Results info */}
			<div className="flex items-center text-sm text-gray-700 space-x-2">
				<span className="text-[#3F3F46]">
					Showing {Math.min(currentPage * pageSize, totalResults)} of{' '}
					{totalResults} results
				</span>
				{/* Per page selector */}
				<div className="flex items-center mr-6 border rounded-lg">
					<span className="text-sm text-[#71717A] border-r py-2 px-3">
						Per page
					</span>
					<Select
						value={String(pageSize)}
						onValueChange={(value) =>
							table.setPageSize(Number(value))
						}
					>
						<SelectTrigger className="w-20 !bg-transparent outline-none border-none ml-0 pr-4">
							<SelectValue placeholder="Page Size" />
						</SelectTrigger>
						<SelectContent>
							{[10, 20, 30, 40, 50].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Right side - Pagination controls */}
			<div className="flex items-center border rounded-lg">
				{/* Previous button */}
				<Button
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					size="icon"
					variant="ghost"
					className="w-8 h-8 text-[#A1A1AA] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<ChevronLeft className="w-4 h-4" />
				</Button>

				{/* Page numbers */}
				{visiblePages.map((page, index) => (
					<React.Fragment key={index}>
						{page === '...' ? (
							<span className="px-2 text-gray-500">...</span>
						) : (
							<button
								onClick={() =>
									table.setPageIndex(Number(page) - 1)
								}
								className={`flex items-center justify-center w-8 h-8 border-x border-[#E4E4E7] text-sm font-medium ${
									page === currentPage
										? 'bg-[#FAFAFA] text-[#547D29]'
										: 'bg-white text-[#3F3F46] hover:bg-gray-50'
								}`}
							>
								{page}
							</button>
						)}
					</React.Fragment>
				))}

				{/* Next button */}
				<Button
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
					size="icon"
					variant="ghost"
					className="w-8 h-8 text-[#A1A1AA] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
