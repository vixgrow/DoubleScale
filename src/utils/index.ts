/**
 * External dependencies
 */
import { keys, find } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import type { Trigger } from '@quillcrm/config';

export const getAction = (action: string) => {
	const actions = ConfigAPI.getAutomationActions();
	const actionGroups = keys(actions);
	for (let i = 0; i < actionGroups.length; i++) {
		const groups = actions[actionGroups[i]].groups;
		const actionGroup = find(groups, (group) => {
			return group.actions[action];
		});

		if (actionGroup) {
			return actionGroup.actions[action];
		}
	}

	return {
		label: '',
		description: '',
		fields: {},
	};
};

export const getGoal = (goal: string) => {
	const goals = ConfigAPI.getAutomationGoals();
	const goalGroups = keys(goals);
	for (let i = 0; i < goalGroups.length; i++) {
		const groups = goals[goalGroups[i]].groups;
		const goalGroup = find(groups, (group) => {
			return group.goals[goal];
		});

		if (goalGroup) {
			return goalGroup.goals[goal];
		}
	}

	return {
		label: '',
		description: '',
		fields: {},
	};
};

export const getTrigger = (trigger: string): Trigger => {
	const automationTriggers = ConfigAPI.getAutomationTriggers();
	const triggerGroups = keys(automationTriggers);
	for (let i = 0; i < triggerGroups.length; i++) {
		const groups = automationTriggers[triggerGroups[i]].groups;
		const triggerGroup = find(groups, (group) => {
			return group.triggers[trigger];
		});

		if (triggerGroup) {
			return triggerGroup.triggers[trigger];
		}
	}

	return {
		label: '',
		description: '',
		fields: {},
	};
};
