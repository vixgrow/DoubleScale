/**
 * Public invoice API (hash-authenticated, no login).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { PublicInvoice, OnlinePaymentInitResponse } from './types';

const formatError = (err: unknown): string => {
	if (err instanceof Error && err.message) {
		return err.message;
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

const getPublicBase = (): string => {
	const config = window.doublescale_invoice_config;
	return config?.public_rest_url || '/wp-json/doublescale/v1/sales/public/invoices';
};

const parseError = async (res: Response): Promise<never> => {
	const body = (await res.json().catch(() => ({}))) as { message?: string };
	throw new Error(body.message || __('Request failed.', 'doublescale'));
};

export const usePublicInvoice = (hash: string | null) => {
	const [data, setData] = useState<PublicInvoice | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(() => {
		if (!hash) {
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		fetch(`${getPublicBase()}/${hash}`)
			.then(async (res) => {
				if (!res.ok) {
					return parseError(res);
				}
				return res.json() as Promise<PublicInvoice>;
			})
			.then((invoice) => setData(invoice))
			.catch((err) => setError(formatError(err)))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export const initPublicInvoicePayment = (
	hash: string,
	gateway: string,
	options?: { agreed_terms?: boolean }
) =>
	fetch(`${getPublicBase()}/${hash}/pay/${gateway}/init`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(
			options?.agreed_terms ? { agreed_terms: true } : {}
		),
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<OnlinePaymentInitResponse>;
	});

export const confirmPublicInvoicePayment = (hash: string, gateway: string) =>
	fetch(`${getPublicBase()}/${hash}/pay/${gateway}/confirm`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<{ invoice?: PublicInvoice }>;
	});

/** @deprecated Use initPublicInvoicePayment */
export const initPublicInvoiceStripe = (hash: string) => initPublicInvoicePayment(hash, 'stripe');

/** @deprecated Use confirmPublicInvoicePayment */
export const confirmPublicInvoiceStripe = (hash: string) => confirmPublicInvoicePayment(hash, 'stripe');

export const getPublicInvoicePdfUrl = (hash: string) => `${getPublicBase()}/${hash}/pdf`;
