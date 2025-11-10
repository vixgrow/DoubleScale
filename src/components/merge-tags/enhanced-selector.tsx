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
import { MergeTagsIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { MergeTags, AutomationMergeTags } from '@quillcrm/config';
import CustomDialogHeader from '../dialog-header';

interface EnhancedMergeTagsSelectorProps {
	visible: boolean;
	onClose: () => void;
	onInsertTag?: (tagValue: string) => void;
	// Enhanced props for dynamic loading
	triggerId?: string;
	formId?: string | number;
	automationId?: string | number;
}

const EnhancedMergeTagsSelector: React.FC<EnhancedMergeTagsSelectorProps> = ({
	visible,
	onClose,
	onInsertTag,
	triggerId,
	formId,
	automationId,
}) => {
	const [selectedTabIndex, setSelectedTabIndex] = useState(0);
	const [dynamicMergeTags, setDynamicMergeTags] =
		useState<AutomationMergeTags | null>(null);
	const [loading, setLoading] = useState(false);

	const { currentTrigger, formContext } = useSelect((select) => ({
		currentTrigger: select('quillcrm/core').getCurrentTrigger(),
		formContext: select('quillcrm/core').getFormContext(),
	}));

	// Use triggerId prop, or fallback to formContext, or currentTrigger from store
	const activeTrigger = triggerId || formContext?.triggerId || currentTrigger;
	// Use formId prop or fallback to formContext
	const activeFormId = formId || formContext?.formId;
	// Use automationId prop or fallback to formContext
	const activeAutomationId = automationId || formContext?.automationId;

	// Load dynamic merge tags when form context changes
	useEffect(() => {
		if (visible && activeFormId && activeTrigger) {
			loadDynamicMergeTags();
		}
	}, [visible, activeFormId, activeTrigger, activeAutomationId]);

	const loadDynamicMergeTags = async () => {
		if (!activeFormId || !activeTrigger) return;

		setLoading(true);
		try {
			const params: any = {
				trigger_id: activeTrigger,
			};

			if (activeFormId) params.form_id = activeFormId;
			if (activeAutomationId) params.automation_id = activeAutomationId;

			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/automations/merge-tags', params),
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
							title={__('Loading Merge Tags...', 'quillcrm')}
							subtitle={__(
								'Loading merge tags for your selected form...',
								'quillcrm'
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
						title={__('Merge Tags', 'quillcrm')}
						subtitle={__(
							'Choose your Merge tags type and Select one of them related to your input.',
							'quillcrm'
						)}
						icon={<MergeTagsIcon />}
					/>
					{/* Show context information */}
					{(activeFormId || activeTrigger) && (
						<div className="text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded">
							<strong>Context:</strong>
							{activeTrigger && ` Trigger: ${activeTrigger}`}
							{activeFormId && ` | Form ID: ${activeFormId}`}
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

		// Log for debugging
		console.log('Merge tag selected:', { tagValue, isDynamic, formId });
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
									'quillcrm'
								)}
							</p>
							<p className="text-sm mt-2">
								{__(
									'Make sure the form has visible fields configured.',
									'quillcrm'
								)}
							</p>
						</>
					) : (
						<p>
							{__(
								'No merge tags available for this trigger.',
								'quillcrm'
							)}
						</p>
					)}
				</div>
			) : (
				map(filteredMergeTags, (tag, key) => (
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
				))
			)}
		</div>
	);
};

export default EnhancedMergeTagsSelector;
