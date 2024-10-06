/**
 * External dependencies
 */
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import type { Trigger, Action, Goal, Rule } from '@quillcrm/config';

export const getAction = (action: string): Action => {
	const actions = ConfigAPI.getAutomationActions();
	const actionGroups = flatMap(actions, (group) =>
		flatMap(group.groups, (group) => group.actions)
	);
	const foundAction = find(actionGroups, (actions) => actions[action]);

	return foundAction
		? foundAction[action]
		: {
				label: '',
				description: '',
				fields: {},
			};
};

export const getGoal = (goal: string): Goal => {
	const goals = ConfigAPI.getAutomationGoals();

	const goalGroups = flatMap(goals, (group) =>
		flatMap(group.groups, (group) => group.goals)
	);

	const foundGoal = find(goalGroups, (goals) => goals[goal]);

	return foundGoal
		? foundGoal[goal]
		: {
				label: '',
				description: '',
				fields: {},
			};
};

export const getTrigger = (trigger: string): Trigger => {
	const automationTriggers = ConfigAPI.getAutomationTriggers();
	const triggersGroups = flatMap(automationTriggers, (group) =>
		flatMap(group.groups, (group) => group.triggers)
	);
	const foundTrigger = find(triggersGroups, (triggers) => triggers[trigger]);

	return foundTrigger
		? foundTrigger[trigger]
		: {
				label: '',
				description: '',
				fields: {},
			};
};

export const convertDate = (date: string) => {
	// Convert to be like April 20, 2021
	const dateObj = new Date(date);
	return dateObj.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

export const getFilterBySlug = (slug: string, group: string) => {
	const filtersGroups = ConfigAPI.getFiltersGroups();
	return filtersGroups[group]['filters'][slug];
};

export const getRuleBySlug = (slug: string): Rule => {
	const automationRules = ConfigAPI.getAutomationRules();
	const rules = flatMap(automationRules, (group) => group.rules);
	const foundRule = find(rules, (rule) => rule[slug]);

	return foundRule
		? foundRule[slug]
		: {
				name: '',
				type: '',
				operators: {},
				options: {},
			};
};

export const formatDate = (date: string, type: string = 'hour') => {
	switch (type) {
		case 'hour':
			return new Date(date).toLocaleTimeString();
		case 'day':
			return new Date(date).toLocaleDateString();
		case 'month':
			return new Date(date).toLocaleDateString(undefined, {
				month: 'long',
				year: 'numeric',
			});
		default:
			return new Date(date).toLocaleTimeString();
	}
};
