import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { __ } from '@wordpress/i18n';
import ListField from '../list-field';
import TagField from '../tag-field';
import {
	AddTagIcon,
	AddToListIcon,
	DeleteIcon,
	RemoveFromListIcon,
	RemoveTagIcon,
} from '@quillcrm/components';

interface BulkActionSelectProps {
	bulkAction: string;
	setBulkAction: (value: string) => void;
	selectedRowKeys: string[];
	doBulkAction: (action: string) => void;
	setSelectedLists: (lists: string[]) => void;
	setSelectedTags: (tags: string[]) => void;
	selectedLists: string[];
	selectedTags: string[];
	activeTab?: string; // Add active tab prop
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
	activeTab,
}) => {
	const handleAction = (value: string) => {
		setBulkAction(value);
		setSelectedLists([]);
		setSelectedTags([]);

		// Only run doBulkAction immediately for direct actions like delete
		if (value === 'delete') {
			doBulkAction(value);
		}
	};

	// Define bulk actions based on active tab
	const getBulkActionsForTab = () => {
		switch (activeTab) {
			case 'all': // All Contacts tab
				return [
					{
						value: 'delete',
						label: __('Delete', 'quillcrm'),
						icon: <DeleteIcon />,
					},
					{
						value: 'add_to_list',
						label: __('Add to List', 'quillcrm'),
						icon: <AddToListIcon />,
					},
					{
						value: 'add_tag',
						label: __('Add Tag', 'quillcrm'),
						icon: <AddTagIcon />,
					},
					{
						value: 'remove_from_list',
						label: __('Remove from List', 'quillcrm'),
						icon: <RemoveFromListIcon />,
					},
					{
						value: 'remove_tag',
						label: __('Remove Tag', 'quillcrm'),
						icon: <RemoveTagIcon />,
					},
				];
			case 'lists': // Lists tab
				return [
					{
						value: 'delete',
						label: __('Delete Lists', 'quillcrm'),
						icon: <DeleteIcon />,
					},
				];
			case 'tags': // Tags tab
				return [
					{
						value: 'delete',
						label: __('Delete Tags', 'quillcrm'),
						icon: <DeleteIcon />,
					},
				];
			case 'custom-fields': // Custom Fields tab
				return [
					{ value: 'delete', label: __('Delete Fields', 'quillcrm') },
				];
			default:
				return [
					{
						value: 'delete',
						label: __('Delete', 'quillcrm'),
						icon: <DeleteIcon />,
					},
				];
		}
	};

	const availableActions = getBulkActionsForTab();

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
					{availableActions.map((action) => (
						<SelectItem key={action.value} value={action.value}>
							<div className="flex items-center gap-2">
								{action.icon} {action.label}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Only show list and tag fields for contacts tab */}
			{activeTab === 'all' &&
				(bulkAction === 'add_to_list' ||
					bulkAction === 'remove_from_list') && (
					<ListField
						value={selectedLists.map((id) => Number(id))}
						onChange={(value) => {
							setSelectedLists(value.map((id) => id.toString()));
							doBulkAction(bulkAction);
						}}
					/>
				)}

			{activeTab === 'all' &&
				(bulkAction === 'add_tag' || bulkAction === 'remove_tag') && (
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
};

export default BulkActionSelect;
