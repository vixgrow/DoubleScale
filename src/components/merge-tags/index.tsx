/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import { GradientMergeTagsIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@doublescale/config';
import type { MergeTags } from '@doublescale/config';
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
	postId?: string | number; // For Elementor forms
}

const MergeTagsSelector: React.FC<MergeTagsSelectorProps> = ({
	visible,
	onClose,
	onInsertTag,
	triggerId,
	formId,
	automationId,
	postId,
}) => {
	// All hooks must be called at the top level
	const [selectedTabIndex, setSelectedTabIndex] = useState(0);

	const { currentTrigger, formContext } = useSelect((select) => ({
		currentTrigger: select('doublescale/core').getCurrentTrigger(),
		formContext: select('doublescale/core').getFormContext(),
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
				postId={postId}
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
						title={__('Merge Tags', 'doublescale')}
						subtitle={__(
							'Choose your Merge tags type and Select one of them related to your input.',
							'doublescale'
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
													'doublescale'
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
	const { createNotice, setMergeTagsVisible } = useDispatch('doublescale/core');

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
				message: __('Merge tag copied to clipboard', 'doublescale'),
				type: 'info',
			});
		}
	};

	return (
		<div className="space-y-3 max-h-96 overflow-y-auto">
			{Object.keys(filteredMergeTags).length === 0 ? (
				<div className="text-center text-gray-500 py-8">
					<p>
						{__(
							'No merge tags available for this group.',
							'doublescale'
						)}
					</p>
					<p className="text-sm mt-2">
						{__(
							'Please configure the required fields or plugin to see merge tags here.',
							'doublescale'
						)}
					</p>
				</div>
			) : (
				map(filteredMergeTags, (tag, key) => (
					<Button
						key={key}
						className="w-full py-8 justify-start rounded-xl border border-border bg-card text-left text-card-foreground shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleTagClick(tag.value);
						}}
					>
						<div className="flex w-full items-center justify-between">
							<span className="grid font-semibold text-base text-[#3F4254]">
								{tag.name}
								<span className="text-xs font-normal italic text-[#505255]">
									{tag.value}
								</span>
							</span>

							<Copy className="h-4 w-4" />
						</div>
					</Button>
				))
			)}
		</div>
	);
};

export default MergeTagsSelector;
