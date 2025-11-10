/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { useState } from 'react';
import { Copy } from 'lucide-react';
import { filter, map } from 'lodash';

/**
 * shadcn/ui components
 */
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogHeader,
} from '@/components/ui/dialog';
import { GradientMergeTagsIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { MergeTags } from '@quillcrm/config';
import CustomDialogHeader from '../dialog-header';
import EnhancedMergeTagsSelector from './enhanced-selector';

interface MergeTagsSelectorProps {
	visible: boolean;
	onClose: () => void;
	onInsertTag?: (tagValue: string) => void;
	// Enhanced props for dynamic loading
	triggerId?: string;
	formId?: string | number;
	automationId?: string | number;
}

const MergeTagsSelector: React.FC<MergeTagsSelectorProps> = ({
	visible,
	onClose,
	onInsertTag,
	triggerId,
	formId,
	automationId,
}) => {
	// All hooks must be called at the top level
	const [selectedTabIndex, setSelectedTabIndex] = useState(0);

	const { currentTrigger, formContext } = useSelect((select) => ({
		currentTrigger: select('quillcrm/core').getCurrentTrigger(),
		formContext: select('quillcrm/core').getFormContext(),
	}));

	// If we have form context (from props or store), use the enhanced selector
	if (
		(formContext && formContext.formId && formContext.triggerId) ||
		(triggerId && formId)
	) {
		return (
			<EnhancedMergeTagsSelector
				visible={visible}
				onClose={onClose}
				onInsertTag={onInsertTag}
				triggerId={triggerId}
				formId={formId}
				automationId={automationId}
			/>
		);
	}

	// Otherwise, use the original static selector
	const automationMergeTags = ConfigAPI.getMergeTags();
	const automationMergeTagsWithTrigger = filter(
		automationMergeTags,
		(group) => {
			// Filter out disabled groups
			if (group.is_disabled) {
				return false;
			}
			return !group.triggers || group.triggers.includes(currentTrigger);
		}
	);

	const selectedGroup = automationMergeTagsWithTrigger[selectedTabIndex];

	return (
		<Dialog open={visible} onOpenChange={() => onClose()}>
			<DialogOverlay className="z-[150500]" />
			<DialogContent className="max-w-4xl min-w-[800px] z-[150500]">
				<DialogHeader>
					<CustomDialogHeader
						title={__('Merge Tags', 'quillcrm')}
						subtitle={__(
							'Choose your Merge tags type and Select one of them related to your input.',
							'quillcrm'
						)}
						icon={<GradientMergeTagsIcon />}
					/>
				</DialogHeader>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
					{/* First Card - Merge Tags Tabs */}
					<Card className="shadow-none">
						<CardContent className="space-y-2 p-6">
							{map(
								automationMergeTagsWithTrigger,
								(group, index) => (
									<Card
										key={index}
										className={`cursor-pointer shadow-none transition-all duration-200 hover:shadow-md ${
											selectedTabIndex === index
												? 'ring-1 ring-primary bg-[#CCDFFF]'
												: 'hover:bg-gray-50'
										}`}
										onClick={() =>
											setSelectedTabIndex(index)
										}
									>
										<CardContent className="p-4">
											<div className="font-semibold text-[#3F4254] text-base">
												{group.name}
											</div>
											<div className="text-xs text-[#9197A4]">
												{__(
													'Select one of Merge tags that related to your input.',
													'quillcrm'
												)}
											</div>
										</CardContent>
									</Card>
								)
							)}
						</CardContent>
					</Card>

					{/* Second Card - Merge Tags List */}
					<Card className="shadow-none">
						<CardContent className="p-6">
							{selectedGroup && (
								<MergeTagsGroupRender
									mergeTags={selectedGroup.mergeTags}
									onInsertTag={onInsertTag}
									activeTrigger={currentTrigger}
								/>
							)}
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const MergeTagsGroupRender: React.FC<{
	mergeTags: MergeTags;
	onInsertTag?: (tagValue: string) => void;
	activeTrigger?: string;
}> = ({ mergeTags, onInsertTag, activeTrigger }) => {
	const { createNotice, setMergeTagsVisible } = useDispatch('quillcrm/core');

	// Filter merge tags based on required_triggers
	const filteredMergeTags = filter(mergeTags, (tag) => {
		// If tag has no required_triggers, show it
		if (!tag.required_triggers || tag.required_triggers.length === 0) {
			return true;
		}
		// If no active trigger, hide tags with required_triggers
		if (!activeTrigger) {
			return false;
		}
		// Show tag only if current trigger is in required_triggers
		return tag.required_triggers.includes(activeTrigger);
	});

	const handleTagClick = (tagValue: string) => {
		if (onInsertTag) {
			onInsertTag(tagValue);
			setMergeTagsVisible(false);
		} else {
			// Fallback to clipboard behavior
			navigator.clipboard.writeText(tagValue);
			createNotice({
				message: __('Merge tag copied to clipboard', 'quillcrm'),
				type: 'info',
			});
		}
	};

	return (
		<div className="space-y-3 max-h-96 overflow-y-auto">
			{map(filteredMergeTags, (tag, key) => (
				<Card
					key={key}
					className="cursor-pointer shadow-none transition-all duration-200 hover:shadow-md hover:bg-gray-50"
					onClick={() => handleTagClick(tag.value)}
				>
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<span className="font-semibold text-[#3F4254] text-base grid">
								{tag.name}
								<span className="text-xs text-[#505255] italic font-normal">
									{tag.value}
								</span>
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleTagClick(tag.value);
								}}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export default MergeTagsSelector;
