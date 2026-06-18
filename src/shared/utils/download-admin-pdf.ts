/**
 * Download a PDF from an authenticated admin REST endpoint.
 */

import { __ } from '@wordpress/i18n';

const getApiRoot = (): string => {
	const root = window.wpApiSettings?.root || '/wp-json/';
	return root.endsWith('/') ? root.slice(0, -1) : root;
};

export const downloadAdminPdf = async (restPath: string, filename: string): Promise<void> => {
	const nonce = window.wpApiSettings?.nonce || '';
	const path = restPath.startsWith('/') ? restPath : `/${restPath}`;
	const res = await fetch(`${getApiRoot()}${path}`, {
		headers: nonce ? { 'X-WP-Nonce': nonce } : {},
		credentials: 'same-origin',
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { message?: string };
		throw new Error(body.message || __('PDF download failed.', 'doublescale'));
	}

	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};
