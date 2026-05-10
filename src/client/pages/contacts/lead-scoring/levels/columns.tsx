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
import { LeadScoringLevel } from './index';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditIcon } from '@doublescale/components';

interface UseLevelsColumnsProps {
	onEditLevel: (level: LeadScoringLevel) => void;
}

export const useLevelsColumns = ({
	onEditLevel,
}: UseLevelsColumnsProps): ColumnDef<LeadScoringLevel>[] => {
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
			accessorKey: 'name',
			header: __('Level Name', 'doublescale'),
			cell: ({ row }) => {
				const name = row.getValue('name') as string;
				return (
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground">
							{name}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'slug',
			header: __('Slug', 'doublescale'),
			cell: ({ row }) => {
				const slug = row.getValue('slug') as string;
				return (
					<Badge variant="outline" className="font-mono text-xs">
						{slug}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'points',
			header: __('Points', 'doublescale'),
			cell: ({ row }) => {
				const points = row.getValue('points') as number;
				return (
					<div className="flex items-center gap-2">
						<span className="font-semibold text-primary">
							{points}
						</span>
						<span className="text-xs text-muted-foreground">
							{__('points', 'doublescale')}
						</span>
					</div>
				);
			},
		},
		{
			id: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => {
				const level = row.original;
				return (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEditLevel(level)}
						className="h-8 w-8 p-0"
					>
						<EditIcon width={16} height={16} />
					</Button>
				);
			},
		},
	];
};
