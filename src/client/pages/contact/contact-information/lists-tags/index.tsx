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
import {
	AddRemoveListsModal,
	AddRemoveTagsModal,
	ListsIcon,
	TagsIcon,
} from '@doublescale/components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactContext } from '../../state/context';
import type { List, Tag } from '@doublescale/client';

const ListsTagsCards: React.FC = () => {
	const { contact, updateContact } = useContactContext();
	const [deletingListId, setDeletingListId] = useState<number | null>(null);
	const [deletingTagId, setDeletingTagId] = useState<number | null>(null);
	const [isAddingLists, setIsAddingLists] = useState(false);
	const [isAddingTags, setIsAddingTags] = useState(false);
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

		setIsAddingLists(true);
		try {
			// Fetch the full list objects
			const response = (await apiFetch({
				path: `/doublescale/v1/lists?ids=${selectedListIds.join(',')}`,
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
		} finally {
			setIsAddingLists(false);
		}
	};

	const handleAddTags = async (selectedTagIds: number[]) => {
		if (!contact) {
			return;
		}

		setIsAddingTags(true);
		try {
			// Fetch the full tag objects
			const response = (await apiFetch({
				path: `/doublescale/v1/tags?ids=${selectedTagIds.join(',')}`,
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
		} finally {
			setIsAddingTags(false);
		}
	};

	return (
		<>
			<div className="flex flex-col gap-0">
				<div className="border-b border-border/40">
					<div className="px-0 py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center text-primary [&_svg]:block">
									<ListsIcon width={20} height={20} />
								</span>
								{__('Lists', 'doublescale')}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsListsCollapsed(!isListsCollapsed)
								}
								className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
							>
								{isListsCollapsed ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronUp className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					{!isListsCollapsed && (
						<div className="px-0 pb-3 pt-1">
							{isAddingLists || deletingListId !== null ? (
								<div className="flex flex-wrap gap-1.5 items-center">
									{contact?.lists && contact.lists.length > 0 ? (
										contact.lists.map((list) => (
											<Skeleton
												key={list.id}
												className="h-6 w-20 rounded-md"
											/>
										))
									) : (
										<Skeleton className="h-6 w-28 rounded-md" />
									)}
								</div>
							) : (
								<div className="flex flex-wrap gap-1.5 items-center">
									{contact?.lists && contact.lists.length > 0 ? (
										contact.lists.map((list) => (
											<Badge
												key={list.id}
												variant="outline"
												className="flex items-center gap-1.5 rounded-lg border-border/50 bg-muted/25 px-2 py-0.5 text-xs font-medium shadow-sm"
											>
												{list.name}
												<X
													className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
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
										<p className="text-xs text-muted-foreground">
											{__('No lists found', 'doublescale')}
										</p>
									)}
									<button
										onClick={() => setIsListModalOpen(true)}
										className="text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-0.5 transition-colors"
									>
										<Plus className="h-3 w-3" />
										{__('Add Lists', 'doublescale')}
									</button>
								</div>
							)}
						</div>
					)}
				</div>
				<div className="border-b border-border/40">
					<div className="px-0 py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center text-primary [&_svg]:block">
									<TagsIcon width={20} height={20} />
								</span>
								{__('Tags', 'doublescale')}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsTagsCollapsed(!isTagsCollapsed)
								}
								className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
							>
								{isTagsCollapsed ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronUp className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					{!isTagsCollapsed && (
						<div className="px-0 pb-3 pt-1">
							{isAddingTags || deletingTagId !== null ? (
								<div className="flex flex-wrap gap-1.5 items-center">
									{contact?.tags && contact.tags.length > 0 ? (
										contact.tags.map((tag) => (
											<Skeleton
												key={tag.id}
												className="h-6 w-20 rounded-md"
											/>
										))
									) : (
										<Skeleton className="h-6 w-28 rounded-md" />
									)}
								</div>
							) : (
								<div className="flex flex-wrap gap-1.5 items-center">
									{contact?.tags && contact.tags.length > 0 ? (
										contact.tags.map((tag) => (
											<Badge
												key={tag.id}
												variant="outline"
												className="flex items-center gap-1.5 rounded-lg border-border/50 bg-muted/25 px-2 py-0.5 text-xs font-medium shadow-sm"
											>
												{tag.name}
												<X
													className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
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
										<p className="text-xs text-muted-foreground">
											{__('No tags found', 'doublescale')}
										</p>
									)}
									<button
										onClick={() => setIsTagModalOpen(true)}
										className="text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-0.5 transition-colors"
									>
										<Plus className="h-3 w-3" />
										{__('Add Tags', 'doublescale')}
									</button>
								</div>
							)}
						</div>
					)}
				</div>
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
