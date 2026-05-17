/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@doublescale/config';
import type { MergeTags, AutomationMergeTags } from '@doublescale/config';
import CustomDialogHeader from '../dialog-header';

interface EnhancedMergeTagsSelectorProps {
	visible: boolean;
	onClose: () => void;
	onInsertTag?: (tagValue: string) => void;
	// Enhanced props for dynamic loading
	triggerId?: string;
	formId?: string | number;
	automationId?: string | number;
	postId?: string | number; // For Elementor forms
}

const EnhancedMergeTagsSelector: React.FC<EnhancedMergeTagsSelectorProps> = ({
	visible,
	onClose,
	onInsertTag,
	triggerId,
	formId,
	automationId,
	postId,
}) => {
	const [selectedTabIndex, setSelectedTabIndex] = useState(0);
	const [dynamicMergeTags, setDynamicMergeTags] =
		useState<AutomationMergeTags | null>(null);
	const [loading, setLoading] = useState(false);

	const { currentTrigger, formContext } = useSelect((select) => ({
		currentTrigger: select('doublescale/core').getCurrentTrigger(),
		formContext: select('doublescale/core').getFormContext(),
	}));

	// Use triggerId prop, or fallback to formContext, or currentTrigger from store
	const activeTrigger = triggerId || formContext?.triggerId || currentTrigger;
	// Use formId prop or fallback to formContext
	const activeFormId = formId || formContext?.formId;
	// Use automationId prop or fallback to formContext
	const activeAutomationId = automationId || formContext?.automationId;
	// Use postId prop or fallback to formContext (for Elementor forms)
	const activePostId = postId || formContext?.postId;

	// Load dynamic merge tags when form context changes
	useEffect(() => {
		if (visible && activeFormId && activeTrigger) {
			loadDynamicMergeTags();
		}
	}, [
		visible,
		activeFormId,
		activeTrigger,
		activeAutomationId,
		activePostId,
	]);

	const loadDynamicMergeTags = async () => {
		if (!activeFormId || !activeTrigger) return;

		setLoading(true);
		try {
			const params: any = {
				trigger_id: activeTrigger,
			};

			if (activeFormId) params.form_id = activeFormId;
			if (activeAutomationId) params.automation_id = activeAutomationId;
			if (activePostId) params.post_id = activePostId; // For Elementor forms

			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/automations/merge-tags', params),
			})) as AutomationMergeTags;

			setDynamicMergeTags(response);
		} catch (error) {
			console.error('Error loading dynamic merge tags:', error);
			// Fallback to static merge tags on error
			setDynamicMergeTags(null);
		} finally {
			setLoading(false);
		}
	};

	// Use dynamic merge tags if available, otherwise fallback to config
	const mergeTags = dynamicMergeTags || ConfigAPI.getMergeTags();

	const automationMergeTagsWithTrigger = filter(mergeTags, (group) => {
		// Filter out disabled groups
		if (group.is_disabled) {
			return false;
		}
		return !group.triggers || group.triggers.includes(activeTrigger);
	});

	const selectedGroup = automationMergeTagsWithTrigger[selectedTabIndex];

	if (loading) {
		return (
			<Dialog open={visible} onOpenChange={() => onClose()}>
				<DialogOverlay className="z-[150500]" />
				<DialogContent className="z-[150500] max-w-4xl gap-0 overflow-hidden rounded-2xl bg-white p-6 sm:max-w-3xl">
					<DialogHeader className="space-y-0 p-0 text-left">
						<CustomDialogHeader
							title={__('Loading Merge Tags...', 'doublescale')}
							subtitle={__(
								'Loading merge tags for your selected form...',
								'doublescale'
							)}
							icon={<GradientMergeTagsIcon />}
						/>
					</DialogHeader>
					<div className="mt-4 flex h-48 items-center justify-center rounded-xl border border-border bg-[#F7F8FA]">
						<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

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
					{(activeFormId || activeTrigger) && (
						<div className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-600">
							{activeTrigger && (
								<span>
									{__('Trigger:', 'doublescale')} {activeTrigger}
								</span>
							)}
							{activeFormId && (
								<span className="ml-2">
									{__('Form ID:', 'doublescale')} {activeFormId}
								</span>
							)}
							{activePostId && (
								<span className="ml-2">
									{__('Post ID:', 'doublescale')} {activePostId}
								</span>
							)}
							{dynamicMergeTags && (
								<span className="ml-2 font-medium text-emerald-700">
									{__('Dynamic fields loaded', 'doublescale')}
								</span>
							)}
						</div>
					)}
				</DialogHeader>

				<div className="mt-4 rounded-xl border border-border bg-[#F7F8FA] p-6">
					<div className="flex flex-wrap gap-4 border-b border-border pb-6">
						{map(automationMergeTagsWithTrigger, (group, index) => {
							const active = selectedTabIndex === index;
							return (
								<button
									key={index}
									type="button"
									onClick={() => setSelectedTabIndex(index)}
									className={cn(
										'inline-flex items-center gap-1.5 rounded-lg border p-2 text-sm transition-colors',
										active
											? 'border-transparent bg-secondary text-secondary-foreground'
											: 'border-border bg-white text-foreground hover:bg-secondary hover:text-secondary-foreground'
									)}
								>
									{group.name}
									{dynamicMergeTags &&
										group.name?.includes('FluentForm') &&
										activeFormId && (
											<span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
												#{activeFormId}
											</span>
										)}
								</button>
							);
						})}
					</div>
					<div className="pt-6">
						{selectedGroup && (
							<MergeTagsGroupRender
								mergeTags={selectedGroup.mergeTags}
								onInsertTag={onInsertTag}
								isDynamic={!!dynamicMergeTags}
								activeTrigger={activeTrigger}
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
	isDynamic?: boolean;
	activeTrigger?: string;
}> = ({ mergeTags, onInsertTag, isDynamic, activeTrigger }) => {
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
		<>
			{Object.keys(filteredMergeTags).length === 0 ? (
				<div className="py-6 text-center text-foreground">
					{isDynamic ? (
						<>
							<p className="text-sm font-medium">
								{__(
									'No fields found for the selected form.',
									'doublescale'
								)}
							</p>
							<p className="mt-2 text-xs text-muted-foreground">
								{__(
									'Make sure the form has visible fields configured.',
									'doublescale'
								)}
							</p>
						</>
					) : (
						<>
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
						</>
					)}
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
								type="button"
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

export default EnhancedMergeTagsSelector;
