/**
 * Sanity check that the Vitest harness boots and all global stubs are wired.
 * Verified in Phase 0; replace with real coverage as Phase 2 lands.
 */

import { describe, expect, it } from 'vitest';
import { mockEndpoint } from './__mocks__/api-fetch';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

describe('Vitest harness', () => {
	it('exposes window.doublescale_admin from setup.ts', () => {
		expect(window.doublescale_admin).toBeDefined();
		expect(window.doublescale_admin?.rest_url).toBe('http://localhost/wp-json/');
	});

	it('stubs @wordpress/i18n.__ as identity', () => {
		expect(__('Hello')).toBe('Hello');
	});

	it('routes @wordpress/api-fetch through the programmable mock', async () => {
		mockEndpoint('GET', '/doublescale/v1/ping', { ok: true });
		const res = await apiFetch<{ ok: boolean }>({ path: '/doublescale/v1/ping' });
		expect(res.ok).toBe(true);
	});

	it('throws on unmocked api-fetch calls', async () => {
		await expect(apiFetch({ path: '/unmocked/route' })).rejects.toThrow(/Unmocked/);
	});

	it('provides matchMedia, IntersectionObserver, ResizeObserver shims', () => {
		expect(window.matchMedia('(min-width: 600px)').matches).toBe(false);
		expect(typeof window.IntersectionObserver).toBe('function');
		expect(typeof window.ResizeObserver).toBe('function');
	});
});
