/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
import { map } from 'lodash';

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
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@doublescale/config';
import type { MergeTags } from '@doublescale/config';
import CustomDialogHeader from '../dialog-header';
import EnhancedMergeTagsSelector from './enhanced-selector';
import {
	filterMergeTagGroups,
	getVisibleMergeTagsForTrigger,
} from './utils';

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

	const automationMergeTags = ConfigAPI.getMergeTags();
	const automationMergeTagsWithTrigger = filterMergeTagGroups(
		automationMergeTags,
		currentTrigger
	);

	useEffect(() => {
		if (selectedTabIndex >= automationMergeTagsWithTrigger.length) {
			setSelectedTabIndex(0);
		}
	}, [automationMergeTagsWithTrigger.length, selectedTabIndex]);

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

	const selectedGroup = automationMergeTagsWithTrigger[selectedTabIndex];

	return (
		<Dialog open={visible} onOpenChange={() => onClose()}>
			<DialogOverlay className="z-[150500]" />
			<DialogContent className="z-[150500] max-w-4xl gap-0 overflow-hidden rounded-2xl bg-white p-6 sm:max-w-3xl">
				<DialogHeader className="space-y-0 p-0 text-left">
					<CustomDialogHeader
						title={__('Merge Tags', 'doublescale')}
						subtitle={__(
							'Choose your Merge tags type and Select one of them related to your input.',
							'doublescale'
						)}
						icon={<GradientMergeTagsIcon />}
					/>
				</DialogHeader>

				<div className="mt-4 rounded-xl border border-border bg-[#F7F8FA] p-6">
					<div className="flex gap-4 border-b border-border pb-6">
						{map(automationMergeTagsWithTrigger, (group, index) => {
							const active = selectedTabIndex === index;
							return (
								<button
									key={index}
									type="button"
									onClick={() => setSelectedTabIndex(index)}
									className={cn(
										'rounded-lg border p-2 text-sm transition-colors',
										active
											? 'border-transparent bg-secondary text-secondary-foreground'
											: 'border-border bg-white text-foreground hover:bg-secondary hover:text-secondary-foreground'
									)}
								>
									{group.name}
								</button>
							);
						})}
					</div>
					<div className="pt-6">
						{selectedGroup && (
							<MergeTagsGroupRender
								mergeTags={selectedGroup.mergeTags}
								onInsertTag={onInsertTag}
								activeTrigger={currentTrigger}
							/>
						)}
					</div>
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

	const filteredMergeTags = getVisibleMergeTagsForTrigger(
		mergeTags,
		activeTrigger
	);

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
		<>
			{Object.keys(filteredMergeTags).length === 0 ? (
				<div className="py-6 text-center text-foreground">
					<p className="text-sm font-medium">
						{__(
							'No merge tags available for this group.',
							'doublescale'
						)}
					</p>
					<p className="mt-2 text-xs text-muted-foreground">
						{__(
							'Please configure the required fields or plugin to see merge tags here.',
							'doublescale'
						)}
					</p>
				</div>
			) : (
				<div className="grid max-h-[min(50vh,24rem)] grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2">
					{map(filteredMergeTags, (tag, key) => (
						<div
							key={key}
							className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
						>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-foreground">
									{tag.name}
								</p>
								<p className="mt-1 break-all text-sm text-muted-foreground">
									{tag.value}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="shrink-0 border-primary bg-white text-primary hover:bg-secondary hover:text-secondary-foreground"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleTagClick(tag.value);
								}}
							>
								{__('Insert', 'doublescale')}
							</Button>
						</div>
					))}
				</div>
			)}
		</>
	);
};

export default MergeTagsSelector;

