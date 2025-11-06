/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	AddRemoveListsModal,
	AddRemoveTagsModal,
	ListsIcon,
	TagsIcon,
} from '@quillcrm/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useContactContext } from '../../state/context';
import type { List, Tag } from '@quillcrm/client';

const ListsTagsCards: React.FC = () => {
	const { contact, updateContact } = useContactContext();
	const [deletingListId, setDeletingListId] = useState<number | null>(null);
	const [deletingTagId, setDeletingTagId] = useState<number | null>(null);
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [isTagModalOpen, setIsTagModalOpen] = useState(false);
	const [isListsCollapsed, setIsListsCollapsed] = useState(false);
	const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);

	const deleteList = async (listId: number) => {
		if (!contact) {
			return;
		}

		setDeletingListId(listId);
		try {
			const updatedLists = contact.lists.filter(
				(list) => list.id !== listId
			);

			// Use updateContact to trigger parent refresh
			await updateContact({
				lists: updatedLists,
			});
		} catch (error: any) {
			console.error('Failed to remove list:', error);
		} finally {
			setDeletingListId(null);
		}
	};

	const deleteTag = async (tagId: number) => {
		if (!contact) {
			return;
		}

		setDeletingTagId(tagId);
		try {
			const updatedTags = contact.tags.filter((tag) => tag.id !== tagId);

			// Use updateContact to trigger parent refresh
			await updateContact({
				tags: updatedTags,
			});
		} catch (error: any) {
			console.error('Failed to remove tag:', error);
		} finally {
			setDeletingTagId(null);
		}
	};

	const handleAddLists = async (selectedListIds: number[]) => {
		if (!contact) {
			return;
		}

		try {
			// Fetch the full list objects
			const response = (await apiFetch({
				path: `/qc/v1/lists?ids=${selectedListIds.join(',')}`,
			})) as { data: List[] };

			const newLists = response.data;

			// Merge with existing lists and remove duplicates
			const allLists = [...contact.lists, ...newLists].filter(
				(list, index, self) =>
					index === self.findIndex((t) => t.id === list.id)
			);

			// Update the contact - the updateContact function will handle the API call and parent refresh
			await updateContact({
				lists: allLists,
			});

			// Close the modal after successful update
			setIsListModalOpen(false);
		} catch (error: any) {
			// Error notification is handled by updateContact
			console.error('Failed to add lists:', error);
		}
	};

	const handleAddTags = async (selectedTagIds: number[]) => {
		if (!contact) {
			return;
		}

		try {
			// Fetch the full tag objects
			const response = (await apiFetch({
				path: `/qc/v1/tags?ids=${selectedTagIds.join(',')}`,
			})) as { data: Tag[] };

			const newTags = response.data;

			// Merge with existing tags and remove duplicates
			const allTags = [...contact.tags, ...newTags].filter(
				(tag, index, self) =>
					index === self.findIndex((t) => t.id === tag.id)
			);

			// Update the contact - the updateContact function will handle the API call and parent refresh
			await updateContact({
				tags: allTags,
			});

			// Close the modal after successful update
			setIsTagModalOpen(false);
		} catch (error: any) {
			// Error notification is handled by updateContact
			console.error('Failed to add tags:', error);
		}
	};

	return (
		<>
			<div className="flex flex-col gap-4 border-b pb-5">
				<Card className="shadow-none">
					<CardHeader className="px-4 py-2 border-b">
						<CardTitle className="flex items-center justify-between font-medium text-lg">
							<div className="flex items-center gap-2">
								<ListsIcon width={26} height={26} />
								{__('Lists', 'quillcrm')}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsListsCollapsed(!isListsCollapsed)
								}
								className="h-8 w-8 p-0"
							>
								{isListsCollapsed ? (
									<ChevronDown className="h-6 w-6" />
								) : (
									<ChevronUp className="h-6 w-6" />
								)}
							</Button>
						</CardTitle>
					</CardHeader>
					{!isListsCollapsed && (
						<CardContent className="p-4">
							<div className="flex flex-wrap gap-2 items-center">
								{contact?.lists && contact.lists.length > 0 ? (
									contact.lists.map((list) => (
										<Badge
											key={list.id}
											variant="outline"
											className="px-3 py-1.5 text-base flex items-center gap-2 bg-transparent border rounded-lg"
										>
											{list.name}
											<X
												className="h-4 w-4 cursor-pointer hover:text-destructive transition-colors"
												onClick={() =>
													deleteList(list.id)
												}
												style={{
													opacity:
														deletingListId ===
														list.id
															? 0.5
															: 1,
													cursor:
														deletingListId ===
														list.id
															? 'wait'
															: 'pointer',
												}}
											/>
										</Badge>
									))
								) : (
									<p className="text-sm text-muted-foreground">
										{__('No lists found', 'quillcrm')}
									</p>
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsListModalOpen(true)}
									className="h-8 px-2 text-primary text-base hover:bg-blue-50"
								>
									<Plus className="h-4 w-4 mr-1" />
									{__('Add Lists', 'quillcrm')}
								</Button>
							</div>
						</CardContent>
					)}
				</Card>
				<Card className="shadow-none">
					<CardHeader className="px-4 py-2 border-b">
						<CardTitle className="flex items-center justify-between font-medium text-lg">
							<div className="flex items-center gap-2">
								<TagsIcon width={26} height={26} />
								{__('Tags', 'quillcrm')}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsTagsCollapsed(!isTagsCollapsed)
								}
								className="h-8 w-8 p-0"
							>
								{isTagsCollapsed ? (
									<ChevronDown className="h-6 w-6" />
								) : (
									<ChevronUp className="h-6 w-6" />
								)}
							</Button>
						</CardTitle>
					</CardHeader>
					{!isTagsCollapsed && (
						<CardContent className="p-4">
							<div className="flex flex-wrap gap-2 items-center">
								{contact?.tags && contact.tags.length > 0 ? (
									contact.tags.map((tag) => (
										<Badge
											key={tag.id}
											variant="outline"
											className="px-3 py-1.5 text-base flex items-center gap-2 bg-transparent border rounded-lg"
										>
											{tag.name}
											<X
												className="h-4 w-4 cursor-pointer hover:text-destructive transition-colors"
												onClick={() =>
													deleteTag(tag.id)
												}
												style={{
													opacity:
														deletingTagId === tag.id
															? 0.5
															: 1,
													cursor:
														deletingTagId === tag.id
															? 'wait'
															: 'pointer',
												}}
											/>
										</Badge>
									))
								) : (
									<p className="text-sm text-muted-foreground">
										{__('No tags found', 'quillcrm')}
									</p>
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsTagModalOpen(true)}
									className="h-8 px-2 text-primary text-base hover:bg-blue-50"
								>
									<Plus className="h-4 w-4 mr-1" />
									{__('Add Tags', 'quillcrm')}
								</Button>
							</div>
						</CardContent>
					)}
				</Card>
			</div>

			{/* Add Lists Modal */}
			<AddRemoveListsModal
				isOpen={isListModalOpen}
				onClose={() => setIsListModalOpen(false)}
				onSubmit={handleAddLists}
				selectedCount={1}
				mode="add"
				initialSelectedLists={[]}
			/>

			{/* Add Tags Modal */}
			<AddRemoveTagsModal
				isOpen={isTagModalOpen}
				onClose={() => setIsTagModalOpen(false)}
				onSubmit={handleAddTags}
				selectedCount={1}
				mode="add"
				initialSelectedTags={[]}
			/>
		</>
	);
};

export default ListsTagsCards;
