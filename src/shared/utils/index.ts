/**
 * External dependencies
 */
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import type { RuleItem } from '@/components/rules-builder';
import type { Action, Goal, Rule, Trigger } from '@doublescale/config';
import ConfigAPI from '@doublescale/config';
import {
	__experimentalGetSettings as experimentalGetDateSettings,
	dateI18n,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
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
	const actionGroups = flatMap(actions, (category) => {
		const tabGroups = category.tabs
			? flatMap(category.tabs, (tab) =>
					normalizeActionGroups(tab.groups)
				)
			: [];
		const directGroups = normalizeActionGroups(category.groups);
		return [...tabGroups, ...directGroups];
	}).flatMap((group) =>
		group?.actions ? [group.actions] : []
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

const normalizeActionGroups = (
	raw:
		| Record<string, { actions?: Record<string, Action> }>
		| Array<{ actions?: Record<string, Action> }>
		| undefined
): Array<{ actions?: Record<string, Action> }> => {
	if (!raw) {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw;
	}
	return Object.values(raw);
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
	const triggersGroups = flatMap(automationTriggers, (category) => {
		const tabGroups = category.tabs
			? flatMap(category.tabs, (tab) =>
					normalizeTriggerGroups(tab.groups)
				)
			: [];
		const directGroups = normalizeTriggerGroups(category.groups);
		return [...tabGroups, ...directGroups];
	}).flatMap((group) =>
		group?.triggers ? [group.triggers] : []
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

const normalizeTriggerGroups = (
	raw:
		| Record<string, { triggers?: Record<string, Trigger> }>
		| Array<{ triggers?: Record<string, Trigger> }>
		| undefined
): Array<{ triggers?: Record<string, Trigger> }> => {
	if (!raw) {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw;
	}
	return Object.values(raw);
};

export const convertDate = (date: string, addTime: boolean = false) => {
	const dateObj = new Date(date);

	if (isNaN(dateObj.getTime())) {
		return null;
	}

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (addTime) {
		const localized = dayjs.utc(date).tz(userTimeZone);
		return sprintf(
			/* translators: 1: date, 2: time */
			__('%1$s at %2$s', 'doublescale'),
			dateI18n('F j, Y', localized.toISOString()),
			dateI18n('g:i a', localized.toISOString())
		);
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
		return __('Just now', 'doublescale');
	}

	const diffInHours = now.diff(targetDate, 'hour');
	const diffInDays = now.diff(targetDate, 'day');
	const diffInWeeks = Math.floor(diffInDays / 7);
	const diffInMonths = now.diff(targetDate, 'month');

	if (diffInMinutes < 60) {
		return sprintf(
			_n('%d minute ago', '%d minutes ago', diffInMinutes, 'doublescale'),
			diffInMinutes
		);
	}

	if (diffInHours < 24) {
		return sprintf(
			_n('%d hour ago', '%d hours ago', diffInHours, 'doublescale'),
			diffInHours
		);
	}

	if (diffInDays < 7) {
		return sprintf(
			_n('%d day ago', '%d days ago', diffInDays, 'doublescale'),
			diffInDays
		);
	}

	if (diffInWeeks < 4) {
		return sprintf(
			_n('%d week ago', '%d weeks ago', diffInWeeks, 'doublescale'),
			diffInWeeks
		);
	}

	if (diffInMonths <= 2) {
		return sprintf(
			_n('%d month ago', '%d months ago', diffInMonths, 'doublescale'),
			diffInMonths
		);
	}

	return dateI18n('M j, Y g:i a', targetDate.toISOString());
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
		return '/doublescale/v1/campaigns';
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
	return automation?.trigger || __('No trigger selected', 'doublescale');
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
 * Get trigger warning message from automation (uses backend-provided message).
 * @param automation - The automation object
 * @returns The trigger warning message
 */
export const getTriggerWarningMessage = (automation: any): string => {
	if (automation?.settings?._trigger_warning_message) {
		return automation.settings._trigger_warning_message;
	}

	const triggerWarning = automation?._warnings?.find(
		(w: { type?: string }) => w.type === 'trigger'
	);
	if (triggerWarning?.message) {
		return triggerWarning.message;
	}

	return __(
		'This trigger requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
		'doublescale'
	);
};

/**
 * Get action label from step (uses backend-provided label)
 * @param step - The automation step object
 * @returns The action label
 */
export const getCatalogActionLabel = (step: any): string => {
	if (step?.settings?._action_label) {
		return step.settings._action_label;
	}

	return step?.action || __('Unknown Action', 'doublescale');
};

export const getActionLabel = (step: any): string => {
	const customLabel = step?.settings?.custom_label?.trim();
	if (customLabel) {
		return customLabel;
	}

	return getCatalogActionLabel(step);
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
		'doublescale'
	);
};

/**
 * Get goal label from step (uses backend-provided label)
 * @param step - The automation step object
 * @returns The goal label
 */
export const getCatalogGoalLabel = (step: any): string => {
	if (step?.settings?._goal_label) {
		return step.settings._goal_label;
	}

	return step?.action || __('Unknown Goal', 'doublescale');
};

export const getGoalLabel = (step: any): string => {
	const customLabel = step?.settings?.custom_label?.trim();
	if (customLabel) {
		return customLabel;
	}

	return getCatalogGoalLabel(step);
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
		'doublescale'
	);
};

/**
 * Extract rule groups from condition step settings.
 * Supports legacy array form and { groups, custom_label } wrapper.
 */
export const getConditionRuleGroups = (settings: any): any[][] => {
	if (!settings) {
		return [];
	}

	if (Array.isArray(settings)) {
		return settings;
	}

	if (settings.groups && Array.isArray(settings.groups)) {
		return settings.groups;
	}

	return [];
};

/**
 * Read custom display label from condition step settings.
 */
export const getConditionCustomLabel = (settings: any): string => {
	if (settings && !Array.isArray(settings) && settings.custom_label) {
		return String(settings.custom_label).trim();
	}

	return '';
};

/**
 * Whether a condition step has at least one rule group configured.
 */
export const hasConditionRules = (settings: any): boolean =>
	getConditionRuleGroups(settings).length > 0;

/**
 * Build condition settings for save, preserving custom_label when set.
 */
export const buildConditionSettings = (
	groups: any[][],
	customLabel?: string
): any => {
	const trimmed = customLabel?.trim();
	if (trimmed) {
		return { groups, custom_label: trimmed };
	}

	return groups;
};

/**
 * Apply or clear a custom label on condition settings.
 */
export const setConditionCustomLabel = (
	settings: any,
	customLabel: string
): any => {
	const groups = getConditionRuleGroups(settings);
	const trimmed = customLabel.trim();

	if (trimmed) {
		return { groups, custom_label: trimmed };
	}

	return groups;
};


/**
 * Get all warnings from automation
 * @param automation - The automation object
 * @returns Array of warnings
 */
export const getAutomationWarnings = (automation: any): any[] => {
	return automation?._warnings || [];
};

/**
 * Shape of WordPress REST API error responses
 * 
 * Standard format: { code: 'error_code', message: 'Error message', data: {...} }
 * Validation errors: { code: 'rest_invalid_param', message: 'Invalid parameter(s): field', data: { params: { field: 'Error details' }, details: {...} } }
 */
type ApiErrorShape = {
	code?: string;
	message?: string;
	data?: {
		message?: string;
		params?: Record<string, string>;
		details?: Record<string, unknown>;
	};
};

/**
 * Rewrite WordPress's "<snake_case> is a required property of <parent>." validator
 * message into a human-friendly "<Title Case> is required." form. Returns the original
 * message untouched when it doesn't match that pattern.
 *
 * @param message - Raw validator message from rest_validate_value_from_schema
 * @returns Humanized form, or the original message if no rewrite applies
 */
export const humanizeRequiredPropertyMessage = (message: string): string => {
	const match = message.match(/^([a-z][a-z0-9_]*) is a required property of [a-z_]+\.$/);
	if (!match) return message;
	const titleCased = match[1]
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
	return `${titleCased} is required.`;
};

/**
 * Extract a user-friendly error message from WordPress REST API errors
 *
 * Handles multiple error formats:
 * 1. Validation errors with detailed params (rest_invalid_param)
 * 2. Standard WP_Error format with message
 * 3. Nested data.message format
 * 4. Plain string errors
 *
 * @param error - The error object from apiFetch
 * @param fallback - Fallback message if no error message found
 * @returns User-friendly error message string
 */
export const getApiErrorMessage = (
	error: unknown,
	fallback: string
): string => {
	const typed = error as ApiErrorShape | undefined;

	// api-fetch throws this when the body is HTML (PHP fatal, timeout, 413)
	// instead of JSON — the stock WP copy is not actionable.
	const rawMessage = typed?.message || '';
	if (
		typed?.code === 'invalid_json' ||
		/not a valid JSON response/i.test(rawMessage)
	) {
		return __(
			"Couldn't save. The server returned an unexpected response instead of confirmation. Try again — if it keeps happening, the email may be too large (images) or the server ran out of memory.",
			'doublescale'
		);
	}

	// Check for validation errors with detailed params
	// WordPress REST API stores validation errors in data.params
	if (typed?.code === 'rest_invalid_param' && typed?.data?.params) {
		const params = typed.data.params;
		const paramErrors = Object.entries(params)
			.map(([field, message]) => {
				// If the field is 'settings', just show the message without the field name
				// as it's more user-friendly
				if (field === 'settings') {
					return humanizeRequiredPropertyMessage(message);
				}
				return `${field}: ${humanizeRequiredPropertyMessage(message)}`;
			})
			.join('; ');

		if (paramErrors) {
			return paramErrors;
		}
	}

	// Standard error message
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

export {
	getSubject,
	groupMessagesIntoThreads,
	type EmailRow,
} from './contact-email-utils';

export {
	getCampaignFiltersFromSettings,
	parseCampaignRecipientFilters,
	type ParsedRecipientFilters,
} from './campaignRecipientFilters';