/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import type { OrganizedStep } from '@quillcrm/client';

/**
 * Find action label from the automation actions configuration
 */
export const findActionLabel = (actionKey: string): string | null => {
	const automationActions = ConfigAPI.getAutomationActions();
	for (const category of Object.values(automationActions)) {
		for (const group of Object.values(category.groups)) {
			if (group.actions?.[actionKey]) {
				return group.actions[actionKey].label;
			}
		}
	}
	return null;
};

/**
 * Find goal label from the automation goals configuration
 */
export const findGoalLabel = (goalKey: string): string | null => {
	const automationGoals = ConfigAPI.getAutomationGoals();
	for (const category of Object.values(automationGoals)) {
		if (category.groups) {
			for (const group of Object.values(category.groups)) {
				if (group.goals?.[goalKey]) {
					return group.goals[goalKey].label;
				}
			}
		}
	}
	return null;
};

/**
 * Title map for different step types
 */
const titleMap: Record<string, (currentStep: OrganizedStep | null) => string> =
	{
		action: (currentStep) =>
			currentStep?.action
				? findActionLabel(currentStep.action) ||
					__('Action Settings', 'quillcrm')
				: __('Action Settings', 'quillcrm'),
		goal: (currentStep) =>
			currentStep?.action
				? findGoalLabel(currentStep.action) ||
					__('Goal Settings', 'quillcrm')
				: __('Goal Settings', 'quillcrm'),
		condition: () => __('Condition Settings', 'quillcrm'),
		delay: (currentStep) =>
			currentStep?.action
				? findActionLabel(currentStep.action) ||
					__('Delay Settings', 'quillcrm')
				: __('Select Delay Type', 'quillcrm'),
	};

/**
 * Get the title for the sidebar based on current state
 */
export const getTitle = (
	isTriggerVisible: boolean,
	currentStep: OrganizedStep | null
): string => {
	if (isTriggerVisible) return __('Trigger Settings', 'quillcrm');
	if (!currentStep) return '';

	const getTitleFn = titleMap[currentStep.type];
	return getTitleFn ? getTitleFn(currentStep) : '';
};
