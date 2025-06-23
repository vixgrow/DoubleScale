import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { __ } from "@wordpress/i18n";
import ListField from "../list-field";
import TagField from "../tag-field";

interface BulkActionSelectProps {
    bulkAction: string;
    setBulkAction: (value: string) => void;
    selectedRowKeys: string[];
    doBulkAction: (action: string) => void;
    setSelectedLists: (lists: string[]) => void;
    setSelectedTags: (tags: string[]) => void;
    selectedLists: string[];
    selectedTags: string[];
}

const BulkActionSelect: React.FC<BulkActionSelectProps> = ({
    bulkAction,
    setBulkAction,
    selectedRowKeys,
    doBulkAction,
    setSelectedLists,
    setSelectedTags,
    selectedLists,
    selectedTags,
}) => {
    const handleAction = (value) => {
        setBulkAction(value);
        setSelectedLists([]);
        setSelectedTags([]);

        // Only run doBulkAction immediately for direct actions like delete
        if (value === "delete") {
            doBulkAction(value);
        }
    };

    return (
        <div className="flex gap-4 flex-wrap">
            <Select
                value={bulkAction}
                onValueChange={handleAction}
                disabled={selectedRowKeys.length === 0}
            >
                <SelectTrigger className="w-[200px] h-9 rounded-xl px-3 py-[20px]">
                    <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">{__("Bulk Actions", "quillcrm")}</SelectItem>
                    <SelectItem value="delete">{__("Delete", "quillcrm")}</SelectItem>
                    <SelectItem value="add_to_list">{__("Add to List", "quillcrm")}</SelectItem>
                    <SelectItem value="add_tag">{__("Add Tag", "quillcrm")}</SelectItem>
                    <SelectItem value="remove_from_list">{__("Remove from List", "quillcrm")}</SelectItem>
                    <SelectItem value="remove_tag">{__("Remove Tag", "quillcrm")}</SelectItem>
                </SelectContent>
            </Select>

            {(bulkAction === "add_to_list" || bulkAction === "remove_from_list") && (
                <ListField
                    value={selectedLists.map((id) => Number(id))}
                    onChange={(value) => {
                        setSelectedLists(value.map((id) => id.toString()));
                        doBulkAction(bulkAction);
                    }}
                />
            )}

            {(bulkAction === "add_tag" || bulkAction === "remove_tag") && (
                <TagField
                    value={selectedTags.map((id) => Number(id))}
                    onChange={(value) => {
                        setSelectedTags(value.map((id) => id.toString()));
                        doBulkAction(bulkAction);
                    }}
                />
            )}
        </div>
    );
}
export default BulkActionSelect;
  