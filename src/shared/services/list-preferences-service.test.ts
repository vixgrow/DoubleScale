/**
 * List preference persistence.
 *
 * These lock in the fix for "filter resets when leaving the page": list pages
 * seed their state from `getListPreferences` synchronously when they mount, so
 * the in-memory config has to be correct the instant a save starts — not once
 * the network round-trip finishes.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('@wordpress/api-fetch', () => ({
	default: (...args: unknown[]) => apiFetchMock(...args),
}));

import {
	getListPreferences,
	primeListPreferences,
	updateListPreferences,
} from './list-preferences-service';

describe('list preferences persistence', () => {
	beforeEach(() => {
		apiFetchMock.mockReset();
		(window as any).doublescaleConfig = { listPreferences: {} };
	});

	it('exposes the new value synchronously, before the PUT resolves', async () => {
		// A PUT that never settles during the assertion below — this is the
		// in-flight window in which the user navigates away and back.
		let resolveRequest: (value: unknown) => void = () => {};
		apiFetchMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveRequest = resolve;
				})
		);

		const pending = updateListPreferences('automations', {
			keyword: 'welcome',
		});

		// The remount read path. Before the fix this returned undefined because
		// the config was only patched in the promise's .then.
		expect(getListPreferences('automations').keyword).toBe('welcome');

		resolveRequest({ keyword: 'welcome' });
		await pending;

		expect(getListPreferences('automations').keyword).toBe('welcome');
	});

	it('merges into existing preferences rather than replacing them', async () => {
		apiFetchMock.mockResolvedValue({ keyword: 'abc', per_page: 25 });

		await updateListPreferences('automations', { per_page: 25 });
		await updateListPreferences('automations', { keyword: 'abc' });

		const prefs = getListPreferences('automations');
		expect(prefs.per_page).toBe(25);
		expect(prefs.keyword).toBe('abc');
	});

	it('does not let a slow earlier response clobber a newer value', async () => {
		// Two writes in flight at once: the first resolves last. Without the
		// sequence guard its stale body would win and restore "ab" -> "abc".
		const resolvers: Array<(value: unknown) => void> = [];
		apiFetchMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				})
		);

		const first = updateListPreferences('automations', { keyword: 'abc' });
		const second = updateListPreferences('automations', { keyword: 'ab' });

		// Newest optimistic value is live immediately.
		expect(getListPreferences('automations').keyword).toBe('ab');

		// Responses arrive out of order: the newer one first, then the older.
		resolvers[1]({ keyword: 'ab' });
		resolvers[0]({ keyword: 'abc' });
		await Promise.all([first, second]);

		expect(getListPreferences('automations').keyword).toBe('ab');
	});

	it('primes the config without issuing a request', () => {
		primeListPreferences('automations', { keyword: 'parked', page: 3 });

		expect(apiFetchMock).not.toHaveBeenCalled();
		expect(getListPreferences('automations')).toMatchObject({
			keyword: 'parked',
			page: 3,
		});
	});

	it('keeps preferences isolated per list key', async () => {
		apiFetchMock.mockResolvedValue({ keyword: 'only-forms' });

		await updateListPreferences('forms', { keyword: 'only-forms' });

		expect(getListPreferences('forms').keyword).toBe('only-forms');
		expect(getListPreferences('automations').keyword).toBeUndefined();
	});
});
