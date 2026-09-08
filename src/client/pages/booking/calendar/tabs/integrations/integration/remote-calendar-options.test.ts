import { describe, expect, it } from 'vitest';
import {
	buildRemoteCalendarOptions,
	decodeRemoteCalendarSelectValue,
	encodeRemoteCalendarSelectValue,
} from './remote-calendar-options';

describe('buildRemoteCalendarOptions', () => {
	it('keeps Google holiday ids with # selectable via an encoded value', () => {
		const options = buildRemoteCalendarOptions([
			{
				name: 'ahmed@gmail.com',
				calendars: [
					{
						id: 'ar.eg#holiday@group.v.calendar.google.com',
						name: 'Holidays',
						can_edit: false,
					},
					{
						id: 'ahmed@gmail.com',
						name: 'Primary',
						can_edit: true,
					},
				],
			},
		]);

		expect(options).toHaveLength(2);
		expect(options[0].calendarId).toBe(
			'ar.eg#holiday@group.v.calendar.google.com'
		);
		expect(options[0].value).not.toContain('#');
		expect(options[0].can_edit).toBe(false);
		expect(options[1].calendarId).toBe('ahmed@gmail.com');
		expect(options[1].can_edit).toBe(true);
		expect(
			decodeRemoteCalendarSelectValue(options[0].value)
		).toBe('ar.eg#holiday@group.v.calendar.google.com');
	});

	it('round-trips encoded select values', () => {
		const raw = 'en.eg#holiday@group.v.calendar.google.com';
		expect(
			decodeRemoteCalendarSelectValue(
				encodeRemoteCalendarSelectValue(raw)
			)
		).toBe(raw);
	});
});
