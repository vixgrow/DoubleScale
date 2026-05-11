/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MoreHorizantail from '@doublescale/shared/icons/moreHorizantal-header';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import TrashIcon from '@doublescale/shared/icons/trash';

interface Props {
	onEdit: () => void;
	onDelete: () => void;
}

export const ActivityActionsDropdown: React.FC<Props> = ({
	onEdit,
	onDelete,
}) => {
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="border border-[#374151] rounded-[8px] px-2 py-1"
				>
					<MoreHorizantail />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				removePortal={true}
				className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-md z-[100000]"
			>
				<DropdownMenuItem
					className="flex items-center gap-2 text-[#09090B] cursor-pointer hover:bg-[#F3F4F6]"
					onClick={onEdit}
				>
					<EditHeaderIcon color="#458DC7"/>
					<span>{__('Edit', 'doublescale')}</span>
				</DropdownMenuItem>

				<DropdownMenuItem
					className="flex items-center gap-2 text-destructive cursor-pointer hover:bg-[#FEE2E2]"
					onClick={onDelete}
				>
					<TrashIcon />
					<span>{__('Delete', 'doublescale')}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
