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
import type { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
	__experimentalGetSettings as experimentalGetDateSettings,
	getSettings as getDateSettings,
} from '@wordpress/date';

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
