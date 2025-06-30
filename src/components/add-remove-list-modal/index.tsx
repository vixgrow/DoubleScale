import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import AsyncSelect from 'react-select/async';
import { Tag as AntTag, Flex } from 'antd';
import { isObject, map } from 'lodash';
import './style.scss';
import type { List, ListsResponse } from '@quillcrm/client';
import {
	CustomDialogHeader,
	GradientListIcon,
	Tag,
} from '@quillcrm/components';

// Define the option type for react-select
interface SelectOption {
	label: string;
	value: number;
}

interface AddRemoveListsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (selectedLists: number[]) => void;
	selectedCount: number;
	mode?: 'add' | 'remove'; // New prop to determine operation mode
	initialSelectedLists?: number[]; // Pre-selected lists when modal opens
}

const AddRemoveListsModal: React.FC<AddRemoveListsModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	selectedCount,
	mode = 'add', // Default to 'add' mode
	initialSelectedLists = [], // Default to empty array
}) => {
	const [selectedLists, setSelectedLists] = useState<number[]>([]);
	const [savedLists, setSavedLists] = useState<List[]>([]);

	const fetchLists = async (
		keyword = '',
		ids: number[] = []
	): Promise<SelectOption[]> => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as ListsResponse;

			// Only add new lists that aren't already in savedLists
			const newLists = response.data.filter(
				(list) => !savedLists.some((saved) => saved.id === list.id)
			);
			setSavedLists((prev) => [...prev, ...newLists]);

			const lists = response.data;
			return lists.map(
				(list: List): SelectOption => ({
					label: list.name,
					value: list.id,
				})
			);
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	useEffect(() => {
		if (selectedLists?.length) {
			fetchLists('', selectedLists);
		}
	}, [selectedLists]);

	// Reset modal state when it closes, but initialize with provided lists when it opens
	useEffect(() => {
		if (isOpen) {
			// When modal opens, set initial selected lists
			setSelectedLists(initialSelectedLists);
			// Fetch list details for the initially selected lists
			if (initialSelectedLists.length > 0) {
				fetchLists('', initialSelectedLists);
			}
		} else {
			// When modal closes, reset state
			setSelectedLists([]);
			setSavedLists([]);
		}
	}, [isOpen, initialSelectedLists]);

	const handleSubmit = () => {
		if (selectedLists.length === 0) {
			return;
		}
		onSubmit(selectedLists);
		handleClose();
	};

	const handleClose = () => {
		setSelectedLists([]);
		setSavedLists([]);
		onClose();
	};

	// Dynamic content based on mode
	const getModalContent = () => {
		if (mode === 'remove') {
			return {
				title: __('Remove From Lists', 'quillcrm'),
				subtitle: __(
					'Select lists to remove contacts from',
					'quillcrm'
				),
				description: __(
					`Remove ${selectedCount} contact(s) from the selected list(s)`,
					'quillcrm'
				),
				selectLabel: __('Select List to Remove From', 'quillcrm'),
				selectPlaceholder: __('Select List to Remove From', 'quillcrm'),
				buttonText: __('Remove from Lists', 'quillcrm'),
			};
		} else {
			return {
				title: __('Add To Lists', 'quillcrm'),
				subtitle: __(
					'Add basic information below to add new List',
					'quillcrm'
				),
				description: __(
					`Add ${selectedCount} contact(s) to the selected list(s)`,
					'quillcrm'
				),
				selectLabel: __('Select List', 'quillcrm'),
				selectPlaceholder: __('Select List', 'quillcrm'),
				buttonText: __('Add to Lists', 'quillcrm'),
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
							icon={<GradientListIcon />}
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
								fetchLists(inputValue).then((data) => {
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

								if (selectedLists.includes(option.value)) {
									return;
								}

								const newLists = [
									...selectedLists,
									option.value,
								];
								setSelectedLists(newLists);
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

					{selectedLists.length > 0 && (
						<Flex gap={8} wrap="wrap">
							{map(selectedLists, (listId) => (
								<Tag
									key={listId}
									label={
										savedLists.find(
											(list) => list.id === listId
										)?.name || `List ${listId}`
									}
									onClose={() => {
										const newLists = selectedLists.filter(
											(list) => list !== listId
										);
										setSelectedLists(newLists);
									}}
								/>
							))}
						</Flex>
					)}

					<div className="flex gap-2">
						<Button
							onClick={handleSubmit}
							disabled={selectedLists.length === 0}
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

export default AddRemoveListsModal;
