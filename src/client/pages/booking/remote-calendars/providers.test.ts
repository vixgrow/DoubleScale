/**
 * Slug contract for Connect to remote calendars. A wrong slug in the OAuth
 * return URL must not select a panel — that is how a stale bookmark used to
 * render an empty right-hand column.
 */
import { describe, expect, it } from 'vitest';
import {
	SLUG_ORDER,
	DEFAULT_PROVIDER_SLUG,
	fallbackProviderCopy,
	normalizeProviderSlug,
	resolveProviderCopy,
	resolveProviderSlug,
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

describe('resolveProviderSlug', () => {
	it('defaults missing and unknown values to Google', () => {
		expect(DEFAULT_PROVIDER_SLUG).toBe('google');
		expect(resolveProviderSlug(null)).toBe('google');
		expect(resolveProviderSlug('')).toBe('google');
		expect(resolveProviderSlug('not-a-provider')).toBe('google');
	});

	it('keeps a valid slug from the OAuth return URL', () => {
		expect(resolveProviderSlug('apple')).toBe('apple');
		expect(resolveProviderSlug('zoom')).toBe('zoom');
		expect(resolveProviderSlug('google')).toBe('google');
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
