/**
 * Public contract API (hash-authenticated, no login).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { PublicContract } from './types';

const formatError = (err: unknown): string => {
	if (err instanceof Error && err.message) {
		return err.message;
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

const getPublicBase = (): string => {
	const config = window.doublescale_contract_config;
	return config?.public_rest_url || '/wp-json/doublescale/v1/sales/public/contracts';
};

const parseError = async (res: Response): Promise<never> => {
	const body = (await res.json().catch(() => ({}))) as { message?: string };
	throw new Error(body.message || __('Request failed.', 'doublescale'));
};

export const usePublicContract = (hash: string | null) => {
	const [data, setData] = useState<PublicContract | null>(null);
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
				return res.json() as Promise<PublicContract>;
			})
			.then((contract) => setData(contract))
			.catch((err) => setError(formatError(err)))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
};

export interface SignContractPayload {
	signed_name?: string;
	signature?: string;
}

export const signPublicContract = (hash: string, payload: SignContractPayload = {}) =>
	fetch(`${getPublicBase()}/${hash}/sign`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	}).then(async (res) => {
		if (!res.ok) {
			return parseError(res);
		}
		return res.json() as Promise<PublicContract>;
	});

export const getPublicContractPdfUrl = (hash: string) => `${getPublicBase()}/${hash}/pdf`;

export interface PublicContractAttachment {
	id: number;
	file_hash: string;
	file_name: string;
	file_size: number;
	file_type: string;
	created_at: string | null;
	url: string;
}

export const usePublicContractAttachments = (hash: string | null) => {
	const [data, setData] = useState<PublicContractAttachment[]>([]);
	const [loading, setLoading] = useState(false);

	const refetch = useCallback(() => {
		if (!hash) {
			setData([]);
			return;
		}
		setLoading(true);
		fetch(`${getPublicBase()}/${hash}/attachments`)
			.then(async (res) => {
				if (!res.ok) {
					return parseError(res);
				}
				return res.json() as Promise<{ data: PublicContractAttachment[] }>;
			})
			.then((response) => setData(Array.isArray(response?.data) ? response.data : []))
			.catch(() => setData([]))
			.finally(() => setLoading(false));
	}, [hash]);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, refetch };
};
