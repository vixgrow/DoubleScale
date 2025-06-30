import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import {
	AddTagIcon,
	AddToListIcon,
	DeleteIcon,
	RemoveFromListIcon,
	RemoveTagIcon,
	AddRemoveListsModal,
	AddRemoveTagsModal,
	DeleteModal
} from '@quillcrm/components';

interface BulkActionSelectProps {
	bulkAction: string;
	setBulkAction: (value: string) => void;
	selectedRowKeys: string[];
	doBulkAction: (action: string, data?: any) => void; // Modified to accept optional data
	setSelectedLists: (lists: string[]) => void;
	setSelectedTags: (tags: string[]) => void;
	selectedLists: string[];
	selectedTags: string[];
	activeTab?: string;
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
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [isTagModalOpen, setIsTagModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // New state for delete modal
	const [modalMode, setModalMode] = useState<'add' | 'remove'>('add');

	const handleAction = (value: string) => {
		setBulkAction(value);

		// Only reset states if we're switching to a different action
		if (value !== 'add_to_list' && value !== 'remove_from_list') {
			setSelectedLists([]);
		}
		if (value !== 'add_tag' && value !== 'remove_tag') {
			setSelectedTags([]);
		}

		// Handle different actions
		if (value === 'delete') {
			setIsDeleteModalOpen(true); // Show confirmation modal instead of immediate action
		} else if (value === 'add_to_list') {
			setModalMode('add');
			setIsListModalOpen(true);
		} else if (value === 'remove_from_list') {
			setModalMode('remove');
			setIsListModalOpen(true);
		} else if (value === 'add_tag') {
			setModalMode('add');
			setIsTagModalOpen(true);
		} else if (value === 'remove_tag') {
			setModalMode('remove');
			setIsTagModalOpen(true);
		}
	};

	const handleDeleteConfirm = () => {
		doBulkAction('delete');
		setIsDeleteModalOpen(false);
	};

	const handleDeleteModalClose = () => {
		setIsDeleteModalOpen(false);
		setBulkAction(''); // Reset bulk action when modal is closed
	};

	const handleListModalSubmit = (lists: number[]) => {
		// Pass the lists directly to doBulkAction
		const listStrings = lists.map((id) => id.toString());
		setSelectedLists(listStrings);

		// Execute the appropriate action based on modal mode
		const action = modalMode === 'add' ? 'add_to_list' : 'remove_from_list';
		doBulkAction(action, { lists: listStrings });

		setIsListModalOpen(false);
	};

	const handleTagModalSubmit = (tags: number[]) => {
		// Pass the tags directly to doBulkAction
		const tagStrings = tags.map((id) => id.toString());
		setSelectedTags(tagStrings);

		// Execute the appropriate action based on modal mode
		const action = modalMode === 'add' ? 'add_tag' : 'remove_tag';
		doBulkAction(action, { tags: tagStrings });

		setIsTagModalOpen(false);
	};

	const handleListModalClose = () => {
		setIsListModalOpen(false);
		// Don't reset selectedLists here for remove operations
	};

	const handleTagModalClose = () => {
		setIsTagModalOpen(false);
		// Don't reset selectedTags here for remove operations
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
		<>
			<div className="flex gap-4 flex-wrap">
				<Select
					value={bulkAction}
					onValueChange={handleAction}
					disabled={selectedRowKeys.length === 0}
				>
					<SelectTrigger className="w-[150px] h-9 rounded-xl px-3 py-[20px] bg-accent border-none text-[#A1A5B7] font-semibold">
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
			</div>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={isDeleteModalOpen}
				onClose={handleDeleteModalClose}
				onConfirm={handleDeleteConfirm}
				selectedCount={selectedRowKeys.length}
				activeTab={activeTab}
			/>

			{/* Unified List Modal for both Add and Remove operations */}
			<AddRemoveListsModal
				isOpen={isListModalOpen}
				onClose={handleListModalClose}
				onSubmit={handleListModalSubmit}
				selectedCount={selectedRowKeys.length}
				mode={modalMode}
				initialSelectedLists={
					modalMode === 'remove'
						? selectedLists.map((id) => Number(id))
						: []
				}
			/>

			{/* Unified Tags Modal for both Add and Remove operations */}
			<AddRemoveTagsModal
				isOpen={isTagModalOpen}
				onClose={handleTagModalClose}
				onSubmit={handleTagModalSubmit}
				selectedCount={selectedRowKeys.length}
				mode={modalMode}
				initialSelectedTags={
					modalMode === 'remove'
						? selectedTags.map((id) => Number(id))
						: []
				}
			/>
		</>
	);
};

export default BulkActionSelect;