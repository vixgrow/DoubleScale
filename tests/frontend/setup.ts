import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetMockedEndpoints } from './__mocks__/api-fetch';

// Window globals the plugin reads at boot. WP normally injects these via
// wp_localize_script(); in tests we stub minimal shapes.
declare global {
	interface Window {
		doublescale_admin?: Record<string, unknown>;
		doublescale_form?: Record<string, unknown>;
	}
}

Object.defineProperty(window, 'doublescale_admin', {
	value: {
		rest_url: 'http://localhost/wp-json/',
		nonce: 'test-nonce',
		admin_url: 'http://localhost/wp-admin/',
		user: { id: 1, display_name: 'Test Admin' },
		is_pro: false,
		capabilities: {},
	},
	writable: true,
});

Object.defineProperty(window, 'doublescale_form', {
	value: {},
	writable: true,
});

// matchMedia: jsdom does not implement it; many UI libs (Radix, antd) call it.
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// IntersectionObserver / ResizeObserver: not in jsdom.
class MockObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
// @ts-expect-error  override
window.IntersectionObserver = MockObserver;
// @ts-expect-error  override
window.ResizeObserver = MockObserver;

// WordPress runtime modules: tests should never hit a real REST endpoint or
// call wp.i18n. Replace with deterministic shims.
vi.mock('@wordpress/api-fetch', async () => {
	const mocked = await import('./__mocks__/api-fetch');
	return { default: mocked.apiFetch };
});

vi.mock('@wordpress/i18n', () => ({
	__: (text: string) => text,
	_x: (text: string) => text,
	_n: (single: string, plural: string, n: number) => (n === 1 ? single : plural),
	sprintf: (format: string, ...args: unknown[]) => {
		let i = 0;
		return format.replace(/%[sd]/g, () => String(args[i++] ?? ''));
	},
}));

afterEach(() => {
	cleanup();
	resetMockedEndpoints();
});
