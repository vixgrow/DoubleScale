/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { isObject, map } from 'lodash';
/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import './style.scss';
import type { Tag as TagType, TagsResponse } from '@quillcrm/client';
import { CustomDialogHeader, GradientTagIcon, Tag } from '@quillcrm/components';

// Define the option type for react-select
interface SelectOption {
	label: string;
	value: number;
}

interface AddRemoveTagsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (selectedTags: number[]) => void;
	selectedCount: number;
	mode?: 'add' | 'remove'; // Operation mode
	initialSelectedTags?: number[]; // Pre-selected tags when modal opens
}

const AddRemoveTagsModal: React.FC<AddRemoveTagsModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	selectedCount,
	mode = 'add', // Default to 'add' mode
	initialSelectedTags = [], // Default to empty array
}) => {
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
	const [savedTags, setSavedTags] = useState<TagType[]>([]);

	const fetchTags = async (
		keyword = '',
		ids: number[] = []
	): Promise<SelectOption[]> => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
					ids: ids,
				}),
			})) as TagsResponse;

			// Only add new tags that aren't already in savedTags
			const newTags = response.data.filter(
				(tag) => !savedTags.some((saved) => saved.id === tag.id)
			);
			setSavedTags((prev) => [...prev, ...newTags]);

			const tags = response.data;
			return tags.map(
				(tag: TagType): SelectOption => ({
					label: tag.name,
					value: tag.id,
				})
			);
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	useEffect(() => {
		if (selectedTags?.length) {
			fetchTags('', selectedTags);
		}
	}, [selectedTags]);

	// Reset modal state when it closes, but initialize with provided tags when it opens
	useEffect(() => {
		if (isOpen) {
			// When modal opens, set initial selected tags
			setSelectedTags(initialSelectedTags);
			// Fetch tag details for the initially selected tags
			if (initialSelectedTags.length > 0) {
				fetchTags('', initialSelectedTags);
			}
		} else {
			// When modal closes, reset state
			setSelectedTags([]);
			setSavedTags([]);
		}
	}, [isOpen, initialSelectedTags]);

	const handleSubmit = () => {
		if (selectedTags.length === 0) {
			return;
		}
		onSubmit(selectedTags);
		handleClose();
	};

	const handleClose = () => {
		setSelectedTags([]);
		setSavedTags([]);
		onClose();
	};

	// Dynamic content based on mode
	const getModalContent = () => {
		if (mode === 'remove') {
			return {
				title: __('Remove Tags', 'quillcrm'),
				subtitle: __('Select tags to remove from contacts', 'quillcrm'),
				description: __(
					`Remove selected tag(s) from ${selectedCount} contact(s)`,
					'quillcrm'
				),
				selectLabel: __('Select Tag to Remove', 'quillcrm'),
				selectPlaceholder: __('Select Tag to Remove', 'quillcrm'),
				buttonText: __('Remove Tags', 'quillcrm'),
			};
		} else {
			return {
				title: __('Add Tags', 'quillcrm'),
				subtitle: __('Select tags to add to contacts', 'quillcrm'),
				description: __(
					`Add selected tag(s) to ${selectedCount} contact(s)`,
					'quillcrm'
				),
				selectLabel: __('Select Tag', 'quillcrm'),
				selectPlaceholder: __('Select Tag', 'quillcrm'),
				buttonText: __('Add Tags', 'quillcrm'),
			};
		}
	};

	const content = getModalContent();

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader className="flex flex-row items-center justify-between pb-4">
					<DialogTitle>
						<CustomDialogHeader
							title={content.title}
							subtitle={content.subtitle}
							icon={<GradientTagIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-base text-black">
							{content.selectLabel}{' '}
							<span className="text-red-600">*</span>
						</label>
						<AsyncSelect<SelectOption>
							key={isOpen ? 'open' : 'closed'} // Force re-render when modal opens
							loadOptions={(inputValue, callback) => {
								fetchTags(inputValue).then((data) => {
									callback(data);
								});
							}}
							defaultOptions
							value={null}
							onChange={(selectedOption) => {
								if (
									!selectedOption ||
									!isObject(selectedOption)
								) {
									return;
								}

								const option = selectedOption as SelectOption;

								if (selectedTags.includes(option.value)) {
									return;
								}

								const newTags = [...selectedTags, option.value];
								setSelectedTags(newTags);
							}}
							placeholder={content.selectPlaceholder}
							styles={{
								control: (styles) => ({
									...styles,
									minHeight: '40px',
									borderRadius: '8px',
								}),
							}}
						/>
					</div>

					{selectedTags.length > 0 && (
						<div className='flex gap-2 flex-wrap'>
							{map(selectedTags, (tagId) => (
								<Tag
									key={tagId}
									label={
										savedTags.find(
											(tag) => tag.id === tagId
										)?.name || `Tag ${tagId}`
									}
									onClose={() => {
										const newTags = selectedTags.filter(
											(tag) => tag !== tagId
										);
										setSelectedTags(newTags);
									}}
								/>
							))}
						</div>
					)}

					<div className="flex gap-2">
						<Button
							onClick={handleSubmit}
							disabled={selectedTags.length === 0}
							size="xl"
							variant={
								mode === 'remove' ? 'destructive' : 'gradient'
							}
							className="w-full"
						>
							{content.buttonText}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddRemoveTagsModal;
