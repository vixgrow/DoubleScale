/**
 * External dependencies
 */
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import type { Action, Goal, Rule, Trigger } from '@quillcrm/config';
import ConfigAPI from '@quillcrm/config';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

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
			is_integration: false,
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

export const convertDate = (date: string, addTime: boolean = false) => {
	const dateObj = new Date(date);

	if (isNaN(dateObj.getTime())) {
		return null;
	}

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (addTime) {
		return dayjs.utc(date).tz(userTimeZone).format('MMMM D, YYYY [on] h:mm A');
	}

	return dayjs.utc(date).tz(userTimeZone).format('MMMM D, YYYY');
};

export const getFilterBySlug = (slug: string, group: string) => {
	const filtersGroups = ConfigAPI.getFiltersGroups();
	return filtersGroups[group]['filters'][slug];
};

export const getRuleBySlug = (slug: string, dynamicRules?: any): Rule => {
	// First try to find in dynamic rules if provided
	if (dynamicRules) {
		const dynamicRulesList = flatMap(dynamicRules, (group) => group.rules);
		const foundDynamicRule = find(dynamicRulesList, (rule) => rule[slug]);
		if (foundDynamicRule) {
			return foundDynamicRule[slug];
		}
	}

	// Fallback to static rules
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

export const getCustomFieldById = (id: number) => {
	const customFieldsGroups = ConfigAPI.getContactFieldsGroups();

	const customFields = flatMap(customFieldsGroups, (group) => group.fields);
	const foundField = find(customFields, (fields) => fields[id]);

	return foundField
		? foundField[id]
		: {
			label: '',
			type: '',
		};
}

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

export function getTimeAgo(dateString: string): string {
	const now = new Date();
	const date = new Date(dateString);
	const diffInMs = now.getTime() - date.getTime();
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	const diffInWeeks = Math.floor(diffInDays / 7);
	const diffInMonths = Math.floor(diffInDays / 30);

	if (diffInMinutes < 1) return 'Just now';
	if (diffInMinutes < 60)
		return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
	if (diffInHours < 24)
		return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
	if (diffInDays < 7)
		return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
	if (diffInWeeks < 4)
		return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
	if (diffInMonths <= 2)
		return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

	// Fallback to full format
	return (
		date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}) +
		' ' +
		date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
	);
}


export const formatDateForAPI = (date: Date | null): string | undefined => {
	if (!date) return undefined;

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
};

/**
 * Get the correct REST API endpoint for a campaign type
 *
 * @param campaignType - Campaign type ('email', 'sms', 'whatsapp')
 * @returns The REST API endpoint path or undefined if invalid type
 */
export const getCampaignEndpoint = (campaignType: string): string | undefined => {
	const endpoints = {
		email: '/qc/v1/email-campaigns',
		sms: '/qc/v1/sms-campaigns',
		whatsapp: '/qc/v1/whatsapp-campaigns',
	} as const;
	return endpoints[campaignType as keyof typeof endpoints];
};