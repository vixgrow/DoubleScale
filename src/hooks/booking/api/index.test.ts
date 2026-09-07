/**
 * Booking REST errors are passed to `onError` as a string. Callers that read
 * `error.message` render an empty body under an "Error" title — the Apple
 * Calendar connect banner bug.
 */
import { describe, expect, it } from 'vitest';
import {
	bookingApiNoticeMessage,
	formatBookingRestError,
} from './index';

describe('bookingApiNoticeMessage', () => {
	const fallback = 'Could not connect. Please try again.';

	it('uses the string useApi already formatted', () => {
		expect(
			bookingApiNoticeMessage(
				'Apple rejected these credentials.',
				fallback
			)
		).toBe('Apple rejected these credentials.');
	});

	it('does not read .message on a string (that is always undefined)', () => {
		const asApiError: unknown = 'HTTP/1.1 401 Unauthorized';
		expect(
			bookingApiNoticeMessage(
				(asApiError as { message?: string }).message,
				fallback
			)
		).toBe(fallback);
		expect(bookingApiNoticeMessage(asApiError, fallback)).toBe(
			'HTTP/1.1 401 Unauthorized'
		);
	});

	it('still accepts an Error-shaped object', () => {
		expect(
			bookingApiNoticeMessage(
				{ message: 'This Apple account already exists.' },
				fallback
			)
		).toBe('This Apple account already exists.');
	});

	it('falls back when the payload is empty', () => {
		expect(bookingApiNoticeMessage('', fallback)).toBe(fallback);
		expect(bookingApiNoticeMessage(undefined, fallback)).toBe(fallback);
	});
});

describe('formatBookingRestError', () => {
	it('keeps the REST message so the banner can show a reason', () => {
		expect(
			formatBookingRestError({
				message: 'E2E Apple CalDAV rejected: use an app-specific password',
			})
		).toBe('E2E Apple CalDAV rejected: use an app-specific password');
	});
});
