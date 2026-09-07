/**
 * Slug contract for Connect to remote calendars. A wrong slug in the OAuth
 * return URL must not select a panel — that is how a stale bookmark used to
 * render an empty right-hand column.
 */
import { describe, expect, it } from 'vitest';
import {
	SLUG_ORDER,
	fallbackProviderCopy,
	normalizeProviderSlug,
	resolveProviderCopy,
} from './providers';

describe('normalizeProviderSlug', () => {
	it('accepts every slug the page actually renders, in list order', () => {
		expect(SLUG_ORDER).toEqual(['google', 'zoom', 'apple', 'outlook']);
		expect(SLUG_ORDER.map(normalizeProviderSlug)).toEqual(SLUG_ORDER);
	});

	it('rejects unknown, empty, and case-shifted values', () => {
		expect(normalizeProviderSlug('not-a-provider')).toBeNull();
		expect(normalizeProviderSlug('GOOGLE')).toBeNull();
		expect(normalizeProviderSlug('')).toBeNull();
		expect(normalizeProviderSlug(null)).toBeNull();
		expect(normalizeProviderSlug(undefined)).toBeNull();
	});
});

describe('resolveProviderCopy', () => {
	it('falls back to bundled copy when the server omits a slug', () => {
		expect(resolveProviderCopy('apple')).toEqual(
			fallbackProviderCopy('apple')
		);
		expect(resolveProviderCopy('apple').name).toMatch(/Apple Calendar/i);
	});

	it('prefers server-injected name and description when present', () => {
		expect(
			resolveProviderCopy('google', {
				name: 'GCal from PHP',
				description: 'Server description',
			})
		).toEqual({
			name: 'GCal from PHP',
			description: 'Server description',
		});
	});
});
