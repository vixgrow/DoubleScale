import { __, sprintf } from '@wordpress/i18n';
import { PlusIcon } from '@doublescale/components';
import TrashIcon from '@doublescale/shared/icons/trash';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@doublescale/components/ui/pagination';
import { Input } from '@doublescale/components/ui/input';

type SegmentTableItem = {
	id: number;
	name: string;
	slug: string;
};

type NewSegment = {
	name: string;
	slug: string;
};

type SegmentTableVariant = 'lists' | 'tags';

type SegmentTableProps = {
	variant?: SegmentTableVariant;
	items: SegmentTableItem[];
	loading: boolean;
	isSaving: boolean;
	canAddNewSegment: boolean;
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
	variant = 'lists',
	items,
	loading,
	isSaving,
	canAddNewSegment,
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
	const isTags = variant === 'tags';
	const columnCount = 3;

	const nameColumnLabel = isTags
		? __('Tag Name', 'doublescale')
		: __('Segment Name', 'doublescale');
	const namePlaceholder = isTags
		? __('Tag name', 'doublescale')
		: __('Segment Name', 'doublescale');
	const addAriaLabel = isTags
		? __('Add tag', 'doublescale')
		: __('Add segment', 'doublescale');
	const editAriaLabel = isTags
		? __('Edit tag', 'doublescale')
		: __('Edit segment', 'doublescale');
	const deleteAriaLabel = isTags
		? __('Delete tag', 'doublescale')
		: __('Delete segment', 'doublescale');

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
		<div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
			<table className="w-full border-collapse">
				<thead>
					<tr className="border-b border-[#E5E7EB] bg-[#F5F5F5]">
						<th className="px-5 py-3.5 text-left text-sm font-semibold text-[#2A2E34]">
							{nameColumnLabel}
						</th>
						<th className="px-5 py-3.5 text-left text-sm font-semibold text-[#2A2E34]">
							{__('Slug', 'doublescale')}
						</th>
						<th className="px-5 py-3.5 text-center text-sm font-semibold text-[#2A2E34]">
							{__('Actions', 'doublescale')}
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-[#E5E7EB]">
					<tr >
						<td className="min-w-0 px-5 py-3">
							<Input
								
								placeholder={namePlaceholder}
								value={newSegment.name}
								onChange={(event) => onChangeNewName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								disabled={isSaving}
							/>
						</td>
						<td className="min-w-0 px-5 py-3">
							<Input
								
								placeholder={__('Slug', 'doublescale')}
								value={newSegment.slug}
								onChange={(event) => onChangeNewSlug(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								disabled={isSaving}
							/>
						</td>
						<td className="px-5 py-3">
							<div className="flex justify-center">
								<button
									type="button"
									onClick={onAdd}
									disabled={isSaving || !canAddNewSegment}
									className="group flex p-2 shrink-0 items-center rounded-lg border border-brandPrimary justify-center text-brandPrimary transition-all"
									aria-label={addAriaLabel}
								>
									<PlusIcon color="currentColor" width={24} height={24} />
								</button>
							</div>
						</td>
					</tr>

					{loading && (
						<tr className="bg-white">
							<td
								colSpan={columnCount}
								className="px-5 py-10 text-center text-sm text-muted-foreground"
							>
								{__('Loading...', 'doublescale')}
							</td>
						</tr>
					)}

					{!loading &&
						items.map((item, rowIndex) => (
							<tr
								key={item.id}
								className={
									rowIndex % 2 === 0 ? 'bg-white ' : 'bg-[#F7F8FA]'
								}
							>
								<td className="min-w-0 px-5 py-3.5 align-middle">
									{editingId === item.id ? (
										<Input
											
											value={editingValues.name}
											onChange={(event) =>
												onChangeEditingName(event.target.value)
											}
											autoFocus
										/>
									) : (
										<span className="text-sm font-medium text-foreground">
											{item.name}
										</span>
									)}
								</td>
								<td className="min-w-0 px-5 py-3.5 align-middle">
									{editingId === item.id ? (
										<Input
											
											value={editingValues.slug}
											onChange={(event) =>
												onChangeEditingSlug(event.target.value)
											}
										/>
									) : (
										<span className="text-sm font-medium text-foreground">{item.slug}</span>
									)}
								</td>
								<td className="px-5 py-3.5 text-center align-middle">
									{editingId === item.id ? (
										<div className="flex justify-center gap-2">
											<button
												type="button"
												onClick={() => onUpdate(item.id)}
												disabled={isSaving}
												className="rounded-lg border border-brandPrimary px-3 py-1.5 text-sm font-medium text-brandPrimary transition-colors hover:bg-brandPrimary/5 disabled:opacity-50"
											>
												{__('Save', 'doublescale')}
											</button>
											<button
												type="button"
												onClick={onCancelEdit}
												disabled={isSaving}
												className="rounded-lg border border-[#DEE1E6] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-50"
											>
												{__('Cancel', 'doublescale')}
											</button>
										</div>
									) : (
										<div className="flex items-center justify-center gap-3">
											<button
												type="button"
												onClick={() => onStartEdit(item)}
												className="inline-flex items-center justify-center rounded-lg text-brandPrimary transition-colors hover:bg-brandPrimary/10"
												aria-label={editAriaLabel}
											>
												<EditHeaderIcon color="currentColor" width={24} height={24} />
											</button>
											<button
												type="button"
												onClick={() => handleDelete(item.id)}
												disabled={isSaving}
												className="inline-flex  items-center justify-center rounded-lg text-[#DC2626] transition-colors hover:bg-red-50 disabled:opacity-50"
												aria-label={deleteAriaLabel}
											>
												<TrashIcon width={24} height={24} />
											</button>
										</div>
									)}
								</td>
							</tr>
						))}

					{!loading && items.length === 0 && (
						<tr className="bg-white">
							<td
								colSpan={columnCount}
								className="px-5 py-10 text-center text-sm text-muted-foreground"
							>
								{emptyMessage}
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{totalRecords > 0 && (
				<div className="flex flex-col gap-3 border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex justify-center items-center gap-4">
						<p className="text-sm text-muted-foreground">
							{sprintf(
								__('Showing %1$s to %2$s of %3$s results', 'doublescale'),
								startRecord,
								endRecord,
								totalRecords
							)}
						</p>
						<div
							className="flex items-center gap-4 bg-card rounded-lg py-2 px-3"
							style={{
								boxShadow:
									'0 0 0 1px rgba(9, 9, 11, 0.10), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
							}}
						>
							<span className="text-sm text-muted-foreground pr-2 border-r border-border">
								{__('Per page', 'doublescale')}
							</span>
							<select
								value={perPage}
								onChange={(event) => {
									onChangePerPage(Number(event.target.value));
									onChangePage(1);
								}}
								className="rounded-md px-3 py-1 text-sm text-foreground border-0 outline:0 focus:border-0 focus:outline-none"
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
