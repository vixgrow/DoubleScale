import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	TableHead,
} from '@/components/ui/table';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationLink,
	PaginationEllipsis,
} from '@/components/ui/pagination';

import { useEffect, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Skeleton } from 'antd';
import { convertDate } from '@quillcrm/utils';
import { __ } from '@wordpress/i18n';
import StageBadge from './StageBadge';


interface Deal {
	id: string;
	name: string;
	value: string;
	stage: string;
	stage_color: string;
	closeDate: string;
	timeInStage: string;
	lastActivity: string;
}

interface PaginationInfo {
	total: number;
	per_page: number;
	current_page: number;
	total_pages: number;
	has_next: boolean;
	has_prev: boolean;
}

const TableActiveDeals = ({
	ownerId,
	filters,
	queryParams,
}: {
	ownerId: number | null;
	filters: any;
	queryParams: string;
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [deals, setDeals] = useState<Deal[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		total: 0,
		per_page: 10,
		current_page: 1,
		total_pages: 0,
		has_next: false,
		has_prev: false,
	});
	const [isLoading, setIsLoading] = useState(false);

	const fetchDeals = async (page: number = 1, search: string = '') => {
		setIsLoading(true);
		try {
			const newQueryParams = new URLSearchParams({
				page: page.toString(),
				per_page: pagination.per_page.toString(),
				...(search && { search }),
				...(ownerId && { owner_id: ownerId.toString() }),
			});

			const response = (await apiFetch({
				path: `/qc/v1/reports/sales-rep/active-deals?${newQueryParams}&${queryParams}`,
			})) as {
				active_deals: Deal[];
				pagination: PaginationInfo;
			};

			setDeals(response.active_deals);
			setPagination(response.pagination);
		} catch (error) {
			console.error('Error fetching deals:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDeals(1, searchTerm);
	}, [searchTerm, filters]);

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= pagination.total_pages) {
			fetchDeals(newPage, searchTerm);
		}
	};

	const handlePerPageChange = (newPerPage: number) => {
		setPagination((prev) => ({ ...prev, per_page: newPerPage }));
		fetchDeals(1, searchTerm);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<CardTitle className="text-xl font-medium text-[#09090B]">
						{__('Active Deals', 'quillcrm')}
						{pagination.total > 0 && (
							<span className="text-xl font-medium text-[#09090B] ml-2">
								({deals.length}
								{__(` active deals`, 'quillcrm')})
							</span>
						)}
					</CardTitle>
					
				</div>
			</CardHeader>
			<CardContent>
				<div className="border border-[#DEE1E6] rounded-[8px] overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="  bg-[#F8F8F8]  rounded-r-[8px] py-4 px-6">
								<TableHead>Deal Name</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Stage</TableHead>
								<TableHead>Close Date</TableHead>
								<TableHead>Time in Stage</TableHead>
								<TableHead>Last Activity</TableHead>
							</TableRow>
						</TableHeader>
						{isLoading ? (
							<TableBody>
								<Skeleton active paragraph={{ rows: 6 }} />
							</TableBody>
						) : (
							<>
								<TableBody>
									{deals.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-gray-500"
											>
												{searchTerm
													? 'No deals found matching your search.'
													: 'No active deals found.'}
											</TableCell>
										</TableRow>
									) : (
										deals.map((deal) => (
											<TableRow
												className="p-6"
												key={deal.id}
											>
												<TableCell className="font-normal text-[#09090B] text-sm">
													{deal.name}
												</TableCell>
												<TableCell className="font-normal text-[#09090B] text-sm">
													{deal.value}
												</TableCell>
												
												<TableCell>
	<StageBadge
		stage={deal.stage} 
		stageColor={deal.stage_color} 
	/>
</TableCell>
												<TableCell>
													{deal.closeDate
														? convertDate(
																deal.closeDate,
																true
															)
														: '__'}
												</TableCell>
												<TableCell>
													{deal.timeInStage || 'N/A'}
												</TableCell>
												<TableCell>
													{convertDate(
														deal.lastActivity,
														true
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</>
						)}
					</Table>

					<div className="w-full border-t border-t-[#DEE1E6] bg-transparent flex items-center justify-between gap-2 p-2">
						{/* LEFT SIDE */}
						<div className="flex gap-2 items-center">
							<p className="text-[#3F3F46] text-sm">
								{__(
									`Showing 1 to ${pagination?.total} of ${pagination?.total} results`,
									'quillcrm'
								)}
							</p>

							<div className="flex items-center rounded-[8px] border border-[#E4E4E7] py-2 px-3 w-fit">
								<span className="text-[#71717A] text-sm">
									{__('Per page', 'quillcrm')}
								</span>

								<div className="mx-2 w-[1px] h-7 bg-[#E4E4E7]"></div>

								<select
									value={pagination.per_page}
									onChange={(e) =>
										handlePerPageChange(
											Number(e.target.value)
										)
									}
									className="border-0 text-sm focus:outline-none"
								>
									<option value={5}>5</option>
									<option value={10}>10</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
								</select>
							</div>
						</div>

						{/* RIGHT SIDE */}
						<div>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() =>
												handlePageChange(
													pagination.current_page - 1
												)
											}
											className={
												!pagination.has_prev
													? 'pointer-events-none opacity-40'
													: ''
											}
										/>
									</PaginationItem>

									{Array.from(
										{ length: pagination.total_pages },
										(_, i) => i + 1
									)
										.filter((page) => {
											const current =
												pagination.current_page;
											return (
												page === 1 ||
												page ===
													pagination.total_pages ||
												(page >= current - 1 &&
													page <= current + 1)
											);
										})
										.map((page, index, array) => (
											<PaginationItem key={page}>
												{index > 0 &&
													array[index - 1] !==
														page - 1 && (
														<PaginationEllipsis />
													)}
												<PaginationLink
													onClick={() =>
														handlePageChange(page)
													}
													isActive={
														pagination.current_page ===
														page
													}
												>
													{page}
												</PaginationLink>
											</PaginationItem>
										))}

									<PaginationItem>
										<PaginationNext
											onClick={() =>
												handlePageChange(
													pagination.current_page + 1
												)
											}
											className={
												!pagination.has_next
													? 'pointer-events-none opacity-40'
													: ''
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>

						{/* {pagination.total_pages > 1 && (
					<div className="flex items-center justify-between mt-4 pt-4 border-t">
						<div className="text-sm text-gray-500">
							Showing{' '}
							{(pagination.current_page - 1) *
								pagination.per_page +
								1}{' '}
							to{' '}
							{Math.min(
								pagination.current_page * pagination.per_page,
								pagination.total
							)}{' '}
							of {pagination.total} results
						</div>

						<div className="flex items-center gap-2">
							<button
								onClick={() =>
									handlePageChange(
										pagination.current_page - 1
									)
								}
								disabled={!pagination.has_prev}
								className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeft className="w-4 h-4" />
								Previous
							</button>

							<div className="flex items-center gap-1">
								{Array.from(
									{ length: pagination.total_pages },
									(_, i) => i + 1
								)
									.filter((page) => {
										const current = pagination.current_page;
										return (
											page === 1 ||
											page === pagination.total_pages ||
											(page >= current - 1 &&
												page <= current + 1)
										);
									})
									.map((page, index, array) => (
										<div
											key={page}
											className="flex items-center"
										>
											{index > 0 &&
												array[index - 1] !==
													page - 1 && (
													<span className="px-2 text-gray-400">
														...
													</span>
												)}
											<button
												onClick={() =>
													handlePageChange(page)
												}
												className={`px-3 py-2 text-sm rounded-lg ${
													page ===
													pagination.current_page
														? 'bg-blue-500 text-white'
														: 'border border-gray-200 hover:bg-gray-50'
												}`}
											>
												{page}
											</button>
										</div>
									))}
							</div>

							<button
								onClick={() =>
									handlePageChange(
										pagination.current_page + 1
									)
								}
								disabled={!pagination.has_next}
								className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)} */}
					</div>
				</div>

				{/* Pagination Controls */}
				
			</CardContent>
		</Card>
	);
};

export default TableActiveDeals;
