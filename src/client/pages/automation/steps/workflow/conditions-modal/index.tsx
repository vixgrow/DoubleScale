/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useLayoutEffect, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './style.scss';
import type { AutomationStep } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import {
	CustomDialogHeader,
	GradientConditionIcon,
} from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import RulesBuilder from '@/components/rules-builder';
import { useAutomationContext } from '../../../state/context';

interface RulesProps {
	step: AutomationStep;
	onSave: (data: Partial<AutomationStep>) => void;
	visible: boolean;
	onClose: () => void;
}

const ConditionsModal: React.FC<RulesProps> = ({
	step,
	onSave,
	visible,
	onClose,
}) => {
	// Get automation context
	const { automation } = useAutomationContext();

	// Get form context and current trigger from store
	const formContext = useSelect((select: any) => {
		return select('quillcrm/core').getFormContext();
	}, []);

	const currentTrigger = useSelect((select: any) => {
		return select('quillcrm/core').getCurrentTrigger();
	}, []);

	// Check for condition warning
	const conditionWarning = automation?._warnings?.find(
		(warning) => warning.type === 'condition' && warning.step_id === step.id
	);

	const hasConditionWarning = step._condition_warning === true;
	const unavailableRulesCount = step._unavailable_rules_count || 0;
	const unavailableRules = step._unavailable_rules || [];

	const [rulesGroups, setRulesGroups] = useState(
		ConfigAPI.getAutomationRules()
	);

	// Filter rules groups by current trigger and disabled status
	const filterRulesByTrigger = (groups: any) => {
		if (!currentTrigger) return groups;

		const filteredGroups: any = {};
		Object.keys(groups).forEach((groupKey) => {
			const group = groups[groupKey];
			// Filter out disabled groups
			if (group.is_disabled) {
				return;
			}
			// Include group if it has no triggers property (available for all)
			// or if the triggers array includes the current trigger
			if (!group.triggers || group.triggers.includes(currentTrigger)) {
				filteredGroups[groupKey] = group;
			}
		});

		return filteredGroups;
	};

	// Get filtered rules groups based on current trigger
	const filteredRulesGroups = filterRulesByTrigger(rulesGroups);

	const firstGroup = Object.keys(filteredRulesGroups)[0];
	const firstRule = firstGroup
		? Object.keys(filteredRulesGroups[firstGroup].rules)[0]
		: '';
	const getInitialRule = () => ({
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup,
	});

	const stepRules =
		step.settings &&
		Array.isArray(step.settings) &&
		step.settings.length > 0
			? step.settings
			: [[getInitialRule()]];
	const [rules, setRules] = useState<
		Array<
			Array<{
				rule: string;
				operator: string;
				value: string;
				selectedGroup: string;
			}>
		>
	>(stepRules);
	const [isSaving, setIsSaving] = useState(false);

	// Sync rules state with step.settings when modal opens
	useEffect(() => {
		if (visible) {
			const stepRules =
				step.settings &&
				Array.isArray(step.settings) &&
				step.settings.length > 0
					? step.settings
					: [[getInitialRule()]];
			setRules(stepRules);
			// Reset handled in RulesBuilder
		}
	}, [visible, step.settings]);

	// Fetch dynamic rules when form_context is available
	useEffect(() => {
		const fetchDynamicRules = async () => {
			if (formContext && formContext.formId && formContext.triggerId) {
				try {
					const response = (await apiFetch({
						path: addQueryArgs('/qc/v1/automations/rules', {
							form_id: formContext.formId,
							trigger_id: formContext.triggerId,
						}),
						method: 'GET',
					})) as any;

					if (response) {
						setRulesGroups(response);
						ConfigAPI.setAutomationRules(response);
					}
				} catch (error) {
					console.error('Failed to fetch dynamic rules:', error);
				}
			}
		};

		if (visible) {
			fetchDynamicRules();
		}
	}, [formContext, visible]);

	useLayoutEffect(() => {
		// placeholder
	}, [rules, visible]);

	const save = async (data: Partial<AutomationStep>) => {
		setIsSaving(true);
		try {
			await onSave(data);
			onClose();
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-[150300]" />
			<DialogContent className="max-w-[1000px] max-h-[90vh] z-[150300] overflow-y-auto">
				<DialogHeader>
					<CustomDialogHeader
						title={__('Create a condition', 'quillcrm')}
						subtitle={__(
							'Add up to 5 conditions. Define whether any or all of them must be applicable, for the condition to be met.',
							'quillcrm'
						)}
						icon={<GradientConditionIcon />}
					/>
				</DialogHeader>

				{/* Show warning if condition has plugin dependency issues */}
				{(hasConditionWarning || conditionWarning) &&
					unavailableRulesCount > 0 && (
						<Alert
							variant="destructive"
							className="border-orange-500 bg-orange-50 mx-6"
						>
							<AlertTriangle className="h-4 w-4 text-orange-600" />
							<AlertDescription className="text-sm text-orange-800">
								{conditionWarning?.message}
								{conditionWarning?.plugin_labels &&
									conditionWarning.plugin_labels.length >
										0 && (
										<span className="block mt-1 font-medium">
											{__(
												'Required plugins:',
												'quillcrm'
											)}{' '}
											{conditionWarning.plugin_labels.join(
												', '
											)}
										</span>
									)}
								{unavailableRules.length > 0 && (
									<div className="mt-2">
										<p className="font-medium mb-1">
											{__(
												'Unavailable rules:',
												'quillcrm'
											)}
										</p>
										<ul className="list-disc list-inside space-y-1">
											{unavailableRules.map(
												(rule: any, index: number) => (
													<li
														key={index}
														className="text-xs"
													>
														{rule.rule_slug} (
														{rule.plugin_label})
													</li>
												)
											)}
										</ul>
									</div>
								)}
							</AlertDescription>
						</Alert>
					)}

				<div className="py-4">
					<RulesBuilder
						rules={rules}
						onChange={setRules}
						rulesGroups={filteredRulesGroups}
					/>
				</div>
				<DialogFooter>
					<Button
						onClick={() => save({ settings: rules })}
						disabled={isSaving}
						size="xl"
						className="w-full"
						variant="gradient"
					>
						{isSaving
							? __('Adding...', 'quillcrm')
							: __('Add condition', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionsModal;
