/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
/**
 * Internal dependencies
 */
import type { Note } from '@doublescale/client';
import { Button } from '@doublescale/components/ui/button';
import { DeleteIcon } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface ColumnsProps {
	onEdit: (note: Note) => void;
	onDelete: (note: Note) => void;
}

export function getColumns({ onEdit, onDelete }: ColumnsProps) {
	const columns: ColumnDef<Note>[] = [
		{
			accessorKey: 'title',
			header: __('Title', 'doublescale'),
			cell: ({ row }) => row.original.title,
		},
		{
			accessorKey: 'note',
			header: __('Note', 'doublescale'),
			cell: ({ row }) => (
				<span className="line-clamp-2">
					{row.original.note}
				</span>
			),
		},
		{
			accessorKey: 'source',
			header: __('Source', 'doublescale'),
			cell: ({ row }) => {
				const isDealNote = row.original.deal_id !== null && row.original.deal_id !== undefined;
				const sourceColors: Record<string, string> = {
					deal: 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]',
					contact: 'text-[#5570F1] bg-[#5570F129] border-[#5570F1]',
				};

				const sourceType = isDealNote ? 'deal' : 'contact';
				const colorClass = sourceColors[sourceType];

				return (
					<span
						className={`border rounded-md px-2 py-1 ${colorClass}`}
					>
						{isDealNote ? __('Deal', 'doublescale') : __('Contact', 'doublescale')}
					</span>
				);
			},
		},
		{
			accessorKey: 'type',
			header: __('Type', 'doublescale'),
			cell: ({ row }) => {
				const type = row.original.type;
				const typeColors: Record<string, string> = {
					reminder: 'text-[#A6600B] bg-[#FFF2E2] border-[#A6600B]',
					note: 'text-[#5570F1] bg-[#5570F129] border-[#5570F1]',
				};

				const colorClass = typeColors[type] || typeColors.note;

				return (
					<span
						className={`border rounded-md px-2 py-1 capitalize ${colorClass}`}
					>
						{type}
					</span>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<div className="flex items-center gap-4">
					<Button
						size="sm"
						className="bg-transparent border-none shadow-none p-0 text-muted-foreground hover:bg-transparent hover:text-primary/80"
						onClick={() => onEdit(row.original)}
					>
						<EditHeaderIcon/>
					</Button>
					<Button
						size="sm"
						className="bg-transparent border-none p-0 shadow-none text-destructive hover:bg-transparent hover:text-destructive/80"
						onClick={() => onDelete(row.original)}
					>
						<DeleteIcon />
					</Button>
				</div>
			),
		},
	];

	return columns;
}
