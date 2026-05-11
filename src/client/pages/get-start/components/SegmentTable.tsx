import { __ } from '@wordpress/i18n';
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
		<div className="border border-border/60 rounded-lg overflow-hidden">
			<table className="w-full">
				<thead>
					<tr className="bg-muted/50 border-b border-border/60">
						<th className="text-left px-6 py-4 text-sm font-medium text-foreground">
							{__('Segment Name', 'doublescale')}
						</th>
						<th className="text-left px-6 py-4 text-sm font-medium text-foreground">
							{__('Slug', 'doublescale')}
						</th>
						<th className="text-center px-6 py-4 text-sm font-medium text-foreground">
							{__('Actions', 'doublescale')}
						</th>
					</tr>
				</thead>
				<tbody>
					<tr className="border-b border-border/60">
						<td className="px-6 py-3">
							<input
								type="text"
								placeholder={__('EG User Type', 'doublescale')}
								value={newSegment.name}
								onChange={(event) => onChangeNewName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
								disabled={isSaving}
							/>
						</td>
						<td className="px-6 py-3">
							<input
								type="text"
								placeholder={__('Slug', 'doublescale')}
								value={newSegment.slug}
								onChange={(event) => onChangeNewSlug(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										onAdd();
									}
								}}
								className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
								disabled={isSaving}
							/>
						</td>
						<td className="px-6 py-3 text-center">
							<div className="flex justify-center">
								<button
									type="button"
									onClick={onAdd}
									disabled={isSaving || !newSegment.name}
									className="flex items-center justify-center rounded-full border p-2 border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									aria-label={__('Add segment', 'doublescale')}
								>
									<PlusIcon color="currentColor" width={16} height={16} />
								</button>
							</div>
						</td>
					</tr>

					{loading && (
						<tr>
							<td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
								{__('Loading...', 'doublescale')}
							</td>
						</tr>
					)}

					{!loading &&
						items.map((item) => (
							<tr
								key={item.id}
								className="border-b border-border/60 bg-card hover:bg-muted/30"
							>
								<td className="px-6 py-4">
									{editingId === item.id ? (
										<input
											type="text"
											value={editingValues.name}
											onChange={(event) =>
												onChangeEditingName(event.target.value)
											}
											className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
											autoFocus
										/>
									) : (
										<span className="text-sm text-foreground">
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
											className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
										/>
									) : (
										<span className="text-sm text-foreground">
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
												className="px-3 py-1.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
											>
												{__('Save', 'doublescale')}
											</button>
											<button
												type="button"
												onClick={onCancelEdit}
												disabled={isSaving}
												className="px-3 py-1.5 border border-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors"
											>
												{__('Cancel', 'doublescale')}
											</button>
										</div>
									) : (
										<div className="flex justify-center gap-2">
											<button
												type="button"
												onClick={() => onStartEdit(item)}
												className="inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/5 rounded-lg transition-colors"
												aria-label={__('Edit segment', 'doublescale')}
											>
												<EditHeaderIcon color="currentColor" />
											</button>
											<button
												type="button"
												onClick={() => handleDelete(item.id)}
												disabled={isSaving}
												className="inline-flex items-center justify-center w-8 h-8 text-destructive hover:bg-destructive/5 rounded-lg disabled:opacity-50 transition-colors"
												aria-label={__('Delete segment', 'doublescale')}
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
							<td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
								{emptyMessage}
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{totalRecords > 0 && (
				<div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
					<div className="flex justify-center items-center gap-4">
						<p className="text-sm text-muted-foreground">
							{__('Showing', 'doublescale')} {startRecord} {__('to', 'doublescale')}{' '}
							{endRecord} {__('of', 'doublescale')} {totalRecords}{' '}
							{__('results', 'doublescale')}
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


