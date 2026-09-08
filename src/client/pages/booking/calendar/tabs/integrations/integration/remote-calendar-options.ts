/**
 * Options for the Remote Calendar select.
 *
 * Google holiday calendars use ids like `ar.eg#holiday@group.v.calendar.google.com`.
 * Radix Select matches items with CSS attribute selectors, so a raw `#` in
 * `value` breaks the list — the conflict checkboxes still render because they
 * do not go through Select. Encode the id for the widget, keep the raw id for
 * the API.
 */

export type RemoteCalendarAccount = {
	name?: string;
	calendars?: Array<{
		id?: string | number;
		name?: string;
		can_edit?: boolean;
	}>;
};

export type RemoteCalendarOption = {
	value: string;
	calendarId: string;
	label: string;
	can_edit: boolean;
};

export const encodeRemoteCalendarSelectValue = (
	calendarId: string
): string => encodeURIComponent(calendarId);

export const decodeRemoteCalendarSelectValue = (value: string): string => {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

export const buildRemoteCalendarOptions = (
	accounts: RemoteCalendarAccount[]
): RemoteCalendarOption[] => {
	const options: RemoteCalendarOption[] = [];
	const seen = new Set<string>();

	for (const account of accounts) {
		if (!account.calendars?.length) {
			continue;
		}

		for (const calendar of account.calendars) {
			const calendarId = String(calendar.id ?? '').trim();
			if (!calendarId || seen.has(calendarId)) {
				continue;
			}
			seen.add(calendarId);

			const accountName = account.name || '';
			const readOnly = calendar.can_edit ? '' : ' (Read Only)';

			options.push({
				value: encodeRemoteCalendarSelectValue(calendarId),
				calendarId,
				label: `${calendar.name || calendarId} (${accountName})${readOnly}`,
				can_edit: Boolean(calendar.can_edit),
			});
		}
	}

	return options;
};
