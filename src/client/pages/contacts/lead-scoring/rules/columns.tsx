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
import { LeadScoringRule } from './index';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditIcon } from '@quillcrm/components';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface UseRulesColumnsProps {
	onEditRule: (rule: LeadScoringRule) => void;
}

export const useRulesColumns = ({
	onEditRule,
}: UseRulesColumnsProps): ColumnDef<LeadScoringRule>[] => {
	return [
		{
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && 'indeterminate')
					}
					onCheckedChange={(value) =>
						table.toggleAllPageRowsSelected(!!value)
					}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'title',
			header: __('Title', 'quillcrm'),
			cell: ({ row }) => {
				const title = row.getValue('title') as string;
				return <div className="font-medium text-gray-900">{title}</div>;
			},
		},
		{
			accessorKey: 'points',
			header: __('Points', 'quillcrm'),
			cell: ({ row }) => {
				const points = row.getValue('points') as number;
				const isAdding = row.original.is_adding;

				return (
					<div className="flex items-center gap-2">
						{isAdding ? (
							<TrendingUp className="h-4 w-4 text-green-600" />
						) : (
							<TrendingDown className="h-4 w-4 text-red-600" />
						)}
						<span
							className={`font-semibold ${isAdding ? 'text-green-600' : 'text-red-600'}`}
						>
							{isAdding ? '+' : '-'}
							{points}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: __('Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.getValue('status') as string;
				return (
					<Badge
						variant={status === 'active' ? 'default' : 'secondary'}
						className={
							status === 'active'
								? 'bg-green-100 text-green-800 hover:bg-green-100'
								: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
						}
					>
						{status === 'active'
							? __('Active', 'quillcrm')
							: __('Inactive', 'quillcrm')}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => {
				const rule = row.original;
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEditRule(rule)}
						className="h-8 w-8 p-0"
					>
						<EditIcon width={16} height={16} />
					</Button>
				);
			},
		},
	];
};
