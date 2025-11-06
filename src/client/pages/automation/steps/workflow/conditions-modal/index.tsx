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
import RulesBuilder from '@/components/rules-builder';

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
	// Get form context and current trigger from store
	const formContext = useSelect((select: any) => {
		return select('quillcrm/core').getFormContext();
	}, []);

	const currentTrigger = useSelect((select: any) => {
		return select('quillcrm/core').getCurrentTrigger();
	}, []);

	const [rulesGroups, setRulesGroups] = useState(
		ConfigAPI.getAutomationRules()
	);

	// Filter rules groups by current trigger
	const filterRulesByTrigger = (groups: any) => {
		if (!currentTrigger) return groups;

		const filteredGroups: any = {};
		Object.keys(groups).forEach((groupKey) => {
			const group = groups[groupKey];
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
	const stepRules = step.settings || [[getInitialRule()]];
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
			const stepRules = step.settings || [[getInitialRule()]];
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
