import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoreHorizantail from "@quillcrm/components/icons/moreHorizantal-header";
import EditHeaderIcon from "@quillcrm/components/icons/edit-header";
import TrashIcon from "@quillcrm/components/icons/trash";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

export const ActivityActionsDropdown: React.FC<Props> = ({ onEdit, onDelete }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 border border-[#374151] rounded-[8px] px-2 py-1"
        >
          <MoreHorizantail />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40 bg-white border border-[#E5E7EB] rounded-[8px] shadow-md z-[100000]">
        <DropdownMenuItem
          className="flex items-center gap-2 text-[#09090B] cursor-pointer hover:bg-[#F3F4F6]"
          onClick={onEdit}
        >
          <EditHeaderIcon />
          <span>Edit</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center gap-2 text-[#DC2626] cursor-pointer hover:bg-[#FEE2E2]"
          onClick={onDelete}
        >
          <TrashIcon />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
