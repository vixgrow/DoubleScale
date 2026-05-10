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
import { EditIcon } from '@doublescale/components';
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
			header: __('Title', 'doublescale'),
			cell: ({ row }) => {
				const title = row.getValue('title') as string;
				return <div className="font-medium text-foreground">{title}</div>;
			},
		},
		{
			accessorKey: 'points',
			header: __('Points', 'doublescale'),
			cell: ({ row }) => {
				const points = row.getValue('points') as number;
				const isAdding = row.original.is_adding;

				return (
					<div className="flex items-center gap-2">
						{isAdding ? (
							<TrendingUp className="h-4 w-4 text-emerald-600" />
						) : (
							<TrendingDown className="h-4 w-4 text-destructive" />
						)}
						<span
							className={`font-semibold ${isAdding ? 'text-emerald-600' : 'text-destructive'}`}
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
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.getValue('status') as string;
				return (
					<Badge
						variant={status === 'active' ? 'default' : 'secondary'}
						className={
						status === 'active'
							? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted/50'
						}
					>
						{status === 'active'
							? __('Active', 'doublescale')
							: __('Inactive', 'doublescale')}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			header: __('Actions', 'doublescale'),
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
