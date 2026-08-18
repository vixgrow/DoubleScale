/**
 * Redirect gateway helpers.
 *
 * The client decides "is this a redirect gateway?" purely from the server's
 * `return_query_arg`, so these helpers gate the whole hosted-checkout flow in
 * both payment components.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
	clearRedirectReturnParams,
	isRedirectGateway,
	isRedirectReturn,
} from './redirect-payment';

const setUrl = (url: string) => {
	window.history.replaceState({}, '', url);
};

describe('isRedirectGateway', () => {
	it('treats a non-empty arg as a redirect gateway', () => {
		expect(isRedirectGateway('ds_square_return')).toBe(true);
		expect(isRedirectGateway('ds_woo_return')).toBe(true);
	});

	it('treats an empty or missing arg as in-page (Stripe, PayPal)', () => {
		expect(isRedirectGateway('')).toBe(false);
		expect(isRedirectGateway(undefined)).toBe(false);
	});
});

describe('isRedirectReturn', () => {
	beforeEach(() => {
		setUrl('/invoice/abc');
	});

	it('is false when the marker is absent', () => {
		expect(isRedirectReturn('ds_square_return')).toBe(false);
	});

	it('accepts both 1 and true as the marker value', () => {
		setUrl('/invoice/abc?ds_square_return=1');
		expect(isRedirectReturn('ds_square_return')).toBe(true);

		setUrl('/invoice/abc?ds_square_return=true');
		expect(isRedirectReturn('ds_square_return')).toBe(true);
	});

	it('ignores any other value', () => {
		setUrl('/invoice/abc?ds_square_return=0');
		expect(isRedirectReturn('ds_square_return')).toBe(false);

		setUrl('/invoice/abc?ds_square_return=maybe');
		expect(isRedirectReturn('ds_square_return')).toBe(false);
	});

	/**
	 * Each gateway owns its own marker; one gateway's return must never be
	 * confirmed as another's.
	 */
	it('does not match a different gateway marker', () => {
		setUrl('/invoice/abc?ds_mollie_return=1');

		expect(isRedirectReturn('ds_mollie_return')).toBe(true);
		expect(isRedirectReturn('ds_square_return')).toBe(false);
		expect(isRedirectReturn('ds_woo_return')).toBe(false);
	});

	it('is false for an in-page gateway even with params present', () => {
		setUrl('/invoice/abc?redirect_status=succeeded');

		expect(isRedirectReturn('')).toBe(false);
		expect(isRedirectReturn(undefined)).toBe(false);
	});
});

describe('clearRedirectReturnParams', () => {
	beforeEach(() => {
		setUrl('/invoice/abc');
	});

	it('strips only its own marker', () => {
		setUrl('/invoice/abc?ds_square_return=1&keep=yes');

		clearRedirectReturnParams('ds_square_return');

		const params = new URL(window.location.href).searchParams;
		expect(params.has('ds_square_return')).toBe(false);
		expect(params.get('keep')).toBe('yes');
	});

	it('leaves other gateways markers untouched', () => {
		setUrl('/invoice/abc?ds_square_return=1&ds_mollie_return=1');

		clearRedirectReturnParams('ds_square_return');

		const params = new URL(window.location.href).searchParams;
		expect(params.has('ds_square_return')).toBe(false);
		expect(params.has('ds_mollie_return')).toBe(true);
	});

	it('is a no-op when the marker is absent', () => {
		setUrl('/invoice/abc?keep=yes');
		const before = window.location.href;

		clearRedirectReturnParams('ds_square_return');

		expect(window.location.href).toBe(before);
	});

	it('is a no-op for an in-page gateway', () => {
		setUrl('/invoice/abc?ds_square_return=1');
		const before = window.location.href;

		clearRedirectReturnParams('');
		clearRedirectReturnParams(undefined);

		expect(window.location.href).toBe(before);
	});

	/**
	 * The confirm call happens once; leaving the marker would re-trigger it on
	 * every re-render.
	 */
	it('makes a subsequent isRedirectReturn false', () => {
		setUrl('/invoice/abc?ds_razorpay_return=1');
		expect(isRedirectReturn('ds_razorpay_return')).toBe(true);

		clearRedirectReturnParams('ds_razorpay_return');

		expect(isRedirectReturn('ds_razorpay_return')).toBe(false);
	});
});

describe('gateway marker conventions', () => {
	/**
	 * WooCommerce predates the ds_{slug}_return convention and keeps
	 * `ds_woo_return`; the PHP constant is the source of truth either way.
	 */
	it('supports the legacy Woo marker alongside the new ones', () => {
		const markers = [
			'ds_woo_return',
			'ds_square_return',
			'ds_mollie_return',
			'ds_razorpay_return',
			'ds_authorize_net_return',
		];

		markers.forEach((marker) => {
			setUrl(`/invoice/abc?${marker}=1`);
			expect(isRedirectGateway(marker)).toBe(true);
			expect(isRedirectReturn(marker)).toBe(true);

			clearRedirectReturnParams(marker);
			expect(isRedirectReturn(marker)).toBe(false);
		});
	});
});
