import React from 'react';
import { __ } from '@wordpress/i18n';
import { PlusIcon } from '@quillcrm/components';
import TrashIcon from '@quillcrm/components/icons/trash';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@quillcrm/components/ui/pagination';

type SegmentTableItem = {
	id: number;
	name: string;
	slug: string;
};

type NewSegment = {
	name: string;
	slug: string;
};

type SegmentTableProps = {
	items: SegmentTableItem[];
	loading: boolean;
	isSaving: boolean;
	newSegment: NewSegment;
	editingId: number | null;
	editingValues: NewSegment;
	perPage: number;
	page: number;
	totalRecords: number;
	onChangeNewName: (value: string) => void;
	onChangeNewSlug: (value: string) => void;
	onAdd: () => void;
	onStartEdit: (item: SegmentTableItem) => void;
	onCancelEdit: () => void;
	onChangeEditingName: (value: string) => void;
	onChangeEditingSlug: (value: string) => void;
	onUpdate: (id: number) => void;
	onDelete: (id: number) => void;
	onChangePerPage: (value: number) => void;
	onChangePage: (value: number) => void;
	emptyMessage: string;
	deleteConfirmationMessage: string;
};

export function SegmentTable({
	items,
	loading,
	isSaving,
	newSegment,
	editingId,
	editingValues,
	perPage,
	page,
	totalRecords,
	onChangeNewName,
	onChangeNewSlug,
	onAdd,
	onStartEdit,
	onCancelEdit,
	onChangeEditingName,
	onChangeEditingSlug,
	onUpdate,
	onDelete,
	onChangePerPage,
	onChangePage,
	emptyMessage,
	deleteConfirmationMessage,
}: SegmentTableProps) {
	const totalPages = Math.ceil(totalRecords / perPage);
	const startRecord = (page - 1) * perPage + 1;
	const endRecord = Math.min(page * perPage, totalRecords);

	const handleDelete = (id: number) => {
		if (!confirm(deleteConfirmationMessage)) {
			return;
		}

		onDelete(id);
	};

	return (
		<div className="border border-[#DEE1E6] rounded-[8px] overflow-hidden">
			<table className="w-full">
				<thead>
					<tr className="bg-[#F8F8F8] border-b border-[#DEE1E6]">
						<th className="text-left px-6 py-4 text-sm font-medium text-[#09090B]">
							{__('Segment Name', 'quillcrm')}
						</th>
						<th className="text-left px-6 py-4 text-sm font-medium text-[#09090B]">
							{__('Slug', 'quillcrm')}
						</th>
						<th className="text-center px-6 py-4 text-sm font-medium text-[#09090B]">
							{__('Actions', 'quillcrm')}
						</th>
					</tr>
				</thead>
				<tbody>
					<tr className="border-b border-[#DEE1E6]">
						<td className="px-6 py-3">
							<input
								type="text"
								placeholder={__('EG User Type', 'quillcrm')}
								value={newSegment.name}
								onChange={(event) => onChangeNewName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
								disabled={isSaving}
							/>
						</td>
						<td className="px-6 py-3">
							<input
								type="text"
								placeholder={__('Slug', 'quillcrm')}
								value={newSegment.slug}
								onChange={(event) => onChangeNewSlug(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
								disabled={isSaving}
							/>
						</td>
						<td className="px-6 py-3 text-center">
							<div className="flex justify-center">
								<button
									type="button"
									onClick={onAdd}
									disabled={isSaving || !newSegment.name}
									className="flex items-center justify-center rounded-full border p-2 border-[#374151] text-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
									aria-label={__('Add segment', 'quillcrm')}
								>
									<PlusIcon color="#374151" width={16} height={16} />
								</button>
							</div>
						</td>
					</tr>

					{loading && (
						<tr>
							<td colSpan={3} className="px-6 py-8 text-center text-[#777]">
								{__('Loading...', 'quillcrm')}
							</td>
						</tr>
					)}

					{!loading &&
						items.map((item) => (
							<tr
								key={item.id}
								className="border-b border-[#DEE1E6] bg-white hover:bg-gray-50"
							>
								<td className="px-6 py-4">
									{editingId === item.id ? (
										<input
											type="text"
											value={editingValues.name}
											onChange={(event) =>
												onChangeEditingName(event.target.value)
											}
											className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
											autoFocus
										/>
									) : (
										<span className="text-sm text-[#09090B]">
											{item.name}
										</span>
									)}
								</td>
								<td className="px-6 py-4">
									{editingId === item.id ? (
										<input
											type="text"
											value={editingValues.slug}
											onChange={(event) =>
												onChangeEditingSlug(event.target.value)
											}
											className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
										/>
									) : (
										<span className="text-sm text-[#09090B]">
											{item.slug}
										</span>
									)}
								</td>
								<td className="px-6 py-4 text-center">
									{editingId === item.id ? (
										<div className="flex justify-center gap-2">
											<button
												type="button"
												onClick={() => onUpdate(item.id)}
												disabled={isSaving}
												className="px-4 py-2 border border-[#458DC7] text-[#458DC7] rounded-md text-sm font-medium disabled:opacity-50"
											>
												{__('Save', 'quillcrm')}
											</button>
											<button
												type="button"
												onClick={onCancelEdit}
												disabled={isSaving}
												className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium disabled:opacity-50"
											>
												{__('Cancel', 'quillcrm')}
											</button>
										</div>
									) : (
										<div className="flex justify-center gap-2">
											<button
												type="button"
												onClick={() => onStartEdit(item)}
												className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded"
												aria-label={__('Edit segment', 'quillcrm')}
											>
												<EditHeaderIcon color="#458DC7" />
											</button>
											<button
												type="button"
												onClick={() => handleDelete(item.id)}
												disabled={isSaving}
												className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
												aria-label={__('Delete segment', 'quillcrm')}
											>
												<TrashIcon />
											</button>
										</div>
									)}
								</td>
							</tr>
						))}

					{!loading && items.length === 0 && (
						<tr>
							<td colSpan={3} className="px-6 py-8 text-center text-[#777]">
								{emptyMessage}
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{totalRecords > 0 && (
				<div className="flex items-center justify-between px-6 py-4 border-t border-[#E4E4E7]">
					<div className="flex justify-center items-center gap-4">
						<p className="text-sm text-[#3F3F46]">
							{__('Showing', 'quillcrm')} {startRecord} {__('to', 'quillcrm')}{' '}
							{endRecord} {__('of', 'quillcrm')} {totalRecords}{' '}
							{__('results', 'quillcrm')}
						</p>
						<div
							className="flex items-center gap-4 bg-[#FFF] rounded-[8px] py-2 px-3"
							style={{
								boxShadow:
									'0 0 0 1px rgba(9, 9, 11, 0.10), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
							}}
						>
							<span className="text-sm text-[#71717A] pr-2 border-r border-[#6B7280]">
								{__('Per page', 'quillcrm')}
							</span>
							<select
								value={perPage}
								onChange={(event) => {
									onChangePerPage(Number(event.target.value));
									onChangePage(1);
								}}
								className="rounded-md px-3 py-1 text-sm text-[#09090B] border-0 outline:0 focus:border-0 focus:outline-none"
							>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
							</select>
						</div>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center gap-1">
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(event) => {
												event.preventDefault();
												if (page > 1) {
													onChangePage(page - 1);
												}
											}}
											className={
												page === 1
													? 'pointer-events-none opacity-50'
													: ''
											}
										/>
									</PaginationItem>
									{Array.from(
										{ length: Math.min(5, totalPages) },
										(_, index) => {
											let pageNum;

											if (totalPages <= 5) {
												pageNum = index + 1;
											} else if (page <= 3) {
												pageNum = index + 1;
											} else if (page >= totalPages - 2) {
												pageNum = totalPages - 4 + index;
											} else {
												pageNum = page - 2 + index;
											}

											return (
												<PaginationItem key={pageNum}>
													<PaginationLink
														href="#"
														onClick={(event) => {
															event.preventDefault();
															onChangePage(pageNum);
														}}
														isActive={page === pageNum}
													>
														{pageNum}
													</PaginationLink>
												</PaginationItem>
											);
										}
									)}
									{totalPages > 5 && page < totalPages - 2 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}
									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(event) => {
												event.preventDefault();
												if (page < totalPages) {
													onChangePage(page + 1);
												}
											}}
											className={
												page === totalPages
													? 'pointer-events-none opacity-50'
													: ''
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</div>
			)}
		</div>
	);
}


