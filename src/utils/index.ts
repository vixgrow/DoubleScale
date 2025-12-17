/**
 * External dependencies
 */
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import type { RuleItem } from '@/components/rules-builder';
import type { Action, Goal, Rule, Trigger } from '@quillcrm/config';
import ConfigAPI from '@quillcrm/config';
import {
	__experimentalGetSettings as experimentalGetDateSettings,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

type WordPressTimezone = {
	timezone?: string;
	offsetMinutes?: number;
};

const parseTimezoneOffset = (
	offset: unknown,
	offsetFormatted: unknown
): number | undefined => {
	const parsedNumericOffset =
		typeof offset === 'string' || typeof offset === 'number'
			? Number(offset)
			: undefined;

	if (
		parsedNumericOffset !== undefined &&
		!Number.isNaN(parsedNumericOffset)
	) {
		return parsedNumericOffset * 60;
	}

	if (typeof offsetFormatted === 'string' && offsetFormatted) {
		const match = offsetFormatted.match(/^([+-]?)(\d{1,2}):(\d{2})$/);
		if (match) {
			const [, sign, hours, minutes] = match;
			const totalMinutes =
				parseInt(hours, 10) * 60 + parseInt(minutes, 10);
			return (sign === '-' ? -1 : 1) * totalMinutes;
		}
	}

	return undefined;
};

export const getWordPressTimezone = (): WordPressTimezone => {
	const resolveSettings =
		typeof getDateSettings === 'function'
			? getDateSettings
			: typeof experimentalGetDateSettings === 'function'
				? experimentalGetDateSettings
				: undefined;

	const settings = resolveSettings?.();

	const timezoneString =
		typeof settings?.timezone?.string === 'string' &&
			settings.timezone.string.length > 0
			? settings.timezone.string
			: undefined;

	const offsetMinutes = parseTimezoneOffset(
		settings?.timezone?.offset,
		settings?.timezone?.offsetFormatted
	);

	return {
		timezone: timezoneString,
		offsetMinutes,
	};
};

export const convertToWordPressTimezone = (date: Dayjs): Dayjs => {
	const { timezone: timezoneString, offsetMinutes } = getWordPressTimezone();

	if (timezoneString) {
		return date.tz(timezoneString);
	}

	if (typeof offsetMinutes === 'number' && !Number.isNaN(offsetMinutes)) {
		return date.utc().utcOffset(offsetMinutes);
	}

	return date;
};

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
		return dayjs
			.utc(date)
			.tz(userTimeZone)
			.format('MMMM D, YYYY [on] h:mm A');
	}

	// return dayjs.utc(date).tz(userTimeZone).format('MMMM D, YYYY');
	return dayjs.utc(date).tz(userTimeZone).format('YYYY-MM-DD');
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



export function getTimeAgo(dateString: string): string {
	const parsedUtcDate = dayjs.utc(dateString);
	const parsedDate = parsedUtcDate.isValid()
		? parsedUtcDate
		: dayjs(dateString);

	if (!parsedDate.isValid()) {
		return '';
	}

	const now = convertToWordPressTimezone(dayjs());
	const targetDate = convertToWordPressTimezone(parsedDate);

	const diffInMinutes = now.diff(targetDate, 'minute');

	if (diffInMinutes < 1) {
		return 'Just now';
	}

	const diffInHours = now.diff(targetDate, 'hour');
	const diffInDays = now.diff(targetDate, 'day');
	const diffInWeeks = Math.floor(diffInDays / 7);
	const diffInMonths = now.diff(targetDate, 'month');

	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
	}

	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
	}

	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
	}

	if (diffInWeeks < 4) {
		return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
	}

	if (diffInMonths <= 2) {
		return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
	}

	return targetDate.format('MMM D, YYYY h:mm A');
}

export const formatDateForAPI = (date: Date | null): string | undefined => {
	if (!date) return undefined;

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
};

/**
 * Get the REST API endpoint for a campaign type
 * All campaign types now use the unified campaigns endpoint
 * @param campaignType - The type of campaign ('email', 'sms', 'whatsapp')
 * @returns The API endpoint path or null if invalid type
 */
export const getCampaignEndpoint = (campaignType: string): string | null => {
	const validTypes = ['email', 'sms', 'whatsapp'];

	if (validTypes.includes(campaignType)) {
		return '/qc/v1/campaigns';
	}

	return null;
};

/**
 * Get filtered rules groups (excluding disabled groups and filtering by automation context)
 * @param isAutomation - Whether to filter for automation rules (true) or non-automation rules (false). If undefined, returns all rules.
 * @returns Filtered rules groups object
 */
export const getFilteredRulesGroups = (isAutomation?: boolean) => {
	const allRulesGroups = ConfigAPI.getAutomationRules();
	return Object.keys(allRulesGroups).reduce((acc, key) => {
		const group = allRulesGroups[key];

		// Skip disabled groups
		if (group.is_disabled) {
			return acc;
		}

		// If isAutomation is specified, filter rules within the group
		if (isAutomation !== undefined && group.rules) {
			const filteredRules = Object.keys(group.rules).reduce((rulesAcc, ruleKey) => {
				const rule = group.rules[ruleKey];

				const shouldInclude = isAutomation
					? rule.is_automation === true
					: rule.is_automation === false || rule.is_automation === undefined;

				if (shouldInclude) {
					rulesAcc[ruleKey] = rule;
				}

				return rulesAcc;
			}, {} as any);

			if (Object.keys(filteredRules).length > 0) {
				acc[key] = {
					...group,
					rules: filteredRules
				};
			}
		} else {
			acc[key] = group;
		}

		return acc;
	}, {} as any);
};

/**
 * Get filtered goals (including disabled groups for UI display)
 * @returns Goals object (including disabled groups)
 */
export const getFilteredGoals = () => {
	const allGoals = ConfigAPI.getAutomationGoals();
	return allGoals;
};

/**
 * Get filtered goals by trigger (including disabled groups, but excluding groups not matching the trigger)
 * @param triggerSlug - Trigger slug to filter by
 * @returns Filtered goals object (including disabled groups for UI display)
 */
export const getFilteredGoalsByTrigger = (triggerSlug?: string) => {
	const allGoals = ConfigAPI.getAutomationGoals();

	if (!triggerSlug) {
		return allGoals;
	}

	const filteredGoals: any = {};

	Object.keys(allGoals).forEach((sourceKey) => {
		const source = allGoals[sourceKey];
		const filteredGroups: any = {};

		Object.keys(source.groups).forEach((groupKey) => {
			const group = source.groups[groupKey];

			// Include group if it has no triggers property (available for all)
			// or if the triggers array includes the current trigger
			// NOTE: We don't filter out disabled groups - they will be shown as disabled in the UI
			if (!group.triggers || group.triggers.includes(triggerSlug)) {
				filteredGroups[groupKey] = group;
			}
		});

		// Only include source if it has groups
		if (Object.keys(filteredGroups).length > 0) {
			filteredGoals[sourceKey] = {
				...source,
				groups: filteredGroups
			};
		}
	});

	return filteredGoals;
};

/**
 * Get initial rule for RulesBuilder
 * @param rulesGroups - Rules groups map
 * @returns Initial RuleItem
 */
export const getInitialRule = (rulesGroups: any): RuleItem => {
	const firstGroup = Object.keys(rulesGroups)[0] || '';
	const firstRule = firstGroup
		? Object.keys(rulesGroups[firstGroup]?.rules || {})[0] || ''
		: '';
	return {
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup,
	};
};

// NOTE: Legacy helpers mapRulesToFilters / mapFiltersToRules removed.


/**
 * Get trigger label from automation (uses backend-provided label)
 * @param automation - The automation object
 * @returns The trigger label
 */
export const getTriggerLabel = (automation: any): string => {
	// Use backend-provided label (works even when plugin is deactivated)
	if (automation?.settings?._trigger_label) {
		return automation.settings._trigger_label;
	}

	// Fallback to trigger slug
	return automation?.trigger || __('No trigger selected', 'quillcrm');
};

/**
 * Check if trigger has a plugin dependency warning
 * @param automation - The automation object
 * @returns True if trigger requires a missing plugin
 */
export const hasTriggerWarning = (automation: any): boolean => {
	return automation?.settings?._trigger_warning === true;
};

/**
 * Get action label from step (uses backend-provided label)
 * @param step - The automation step object
 * @returns The action label
 */
export const getActionLabel = (step: any): string => {
	// Use backend-provided label (works even when plugin is deactivated)
	if (step?.settings?._action_label) {
		return step.settings._action_label;
	}

	// Fallback to action slug
	return step?.action || __('Unknown Action', 'quillcrm');
};

/**
 * Check if action has a plugin dependency warning
 * @param step - The automation step object
 * @returns True if action requires a missing plugin
 */
export const hasActionWarning = (step: any): boolean => {
	return step?.settings?._action_warning === true;
};

/**
 * Get action warning message from step (uses backend-provided message)
 * @param step - The automation step object
 * @returns The action warning message
 */
export const getActionWarningMessage = (step: any): string => {
	// Use backend-provided warning message
	if (step?.settings?._action_warning_message) {
		return step.settings._action_warning_message;
	}

	// Fallback message
	return __(
		'This action requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
		'quillcrm'
	);
};

/**
 * Get goal label from step (uses backend-provided label)
 * @param step - The automation step object
 * @returns The goal label
 */
export const getGoalLabel = (step: any): string => {
	// Use backend-provided label (works even when plugin is deactivated)
	if (step?.settings?._goal_label) {
		return step.settings._goal_label;
	}

	// Fallback to action slug
	return step?.action || __('Unknown Goal', 'quillcrm');
};

/**
 * Check if goal has a plugin dependency warning
 * @param step - The automation step object
 * @returns True if goal requires a missing plugin
 */
export const hasGoalWarning = (step: any): boolean => {
	return step?.settings?._goal_warning === true;
};

/**
 * Get goal warning message from step (uses backend-provided message)
 * @param step - The automation step object
 * @returns The goal warning message
 */
export const getGoalWarningMessage = (step: any): string => {
	// Use backend-provided warning message
	if (step?.settings?._goal_warning_message) {
		return step.settings._goal_warning_message;
	}

	// Fallback message
	return __(
		'This goal requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
		'quillcrm'
	);
};


/**
 * Get all warnings from automation
 * @param automation - The automation object
 * @returns Array of warnings
 */
export const getAutomationWarnings = (automation: any): any[] => {
	return automation?._warnings || [];
};

type ApiErrorShape = {
	message?: string;
	data?: {
		message?: string;
	};
};

export const getApiErrorMessage = (
	error: unknown,
	fallback: string
): string => {
	const typed = error as ApiErrorShape | undefined;

	return (
		typed?.message ||
		typed?.data?.message ||
		fallback
	);
};

export const generateSlug = (name: string): string => {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};