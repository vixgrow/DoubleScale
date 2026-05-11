/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
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
import { MergeTagsIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
				<DialogContent className="max-w-4xl min-w-[800px] z-[150500]">
					<DialogHeader>
						<CustomDialogHeader
							title={__('Loading Merge Tags...', 'doublescale')}
							subtitle={__(
								'Loading merge tags for your selected form...',
								'doublescale'
							)}
							icon={<MergeTagsIcon />}
						/>
					</DialogHeader>
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

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
						icon={<MergeTagsIcon />}
					/>
					{/* Show context information */}
					{(activeFormId || activeTrigger) && (
						<div className="text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded">
							<strong>Context:</strong>
							{activeTrigger && ` Trigger: ${activeTrigger}`}
							{activeFormId && ` | Form ID: ${activeFormId}`}
							{activePostId && ` | Post ID: ${activePostId}`}
							{dynamicMergeTags && (
								<span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
									Dynamic Fields Loaded
								</span>
							)}
						</div>
					)}
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
												{/* Show dynamic badge for FluentForms when using dynamic data */}
												{dynamicMergeTags &&
													group.name?.includes(
														'FluentForm'
													) && (
														<span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
															Form #{activeFormId}
														</span>
													)}
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
									isDynamic={!!dynamicMergeTags}
									formId={activeFormId}
									activeTrigger={activeTrigger}
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
	isDynamic?: boolean;
	formId?: string | number;
	activeTrigger?: string;
}> = ({ mergeTags, onInsertTag, isDynamic, formId, activeTrigger }) => {
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
					{isDynamic ? (
						<>
							<p>
								{__(
									'No fields found for the selected form.',
									'doublescale'
								)}
							</p>
							<p className="text-sm mt-2">
								{__(
									'Make sure the form has visible fields configured.',
									'doublescale'
								)}
							</p>
						</>
					) : (
						<>
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
						</>
					)}
				</div>
			) : (
				map(filteredMergeTags, (tag, key) => (
					<Button
						key={key}
						className="w-full justify-start rounded-xl border border-border bg-card text-left text-card-foreground shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none py-8"
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

export default EnhancedMergeTagsSelector;
