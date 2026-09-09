/**
 * User-facing copy for contact-import REST failures.
 *
 * WordPress api-fetch throws `invalid_json` / "The response is not a valid
 * JSON response." when the server returns HTML (PHP fatal, 504, timeout)
 * instead of JSON. The stock sentence does not tell the importer what
 * happened or how to finish a partial import.
 */

import { __, sprintf } from '@wordpress/i18n';

export type ImportErrorStats = {
	imported?: number;
	skipped?: number;
	failed?: number;
};

type ApiErrorShape = {
	code?: string;
	message?: string;
};

export const isInvalidJsonResponse = (error: unknown): boolean => {
	const typed = error as ApiErrorShape | undefined;
	const rawMessage = typed?.message || '';
	return (
		typed?.code === 'invalid_json' ||
		/not a valid JSON response/i.test(rawMessage)
	);
};

export const getImportErrorMessage = (
	error: unknown,
	stats: ImportErrorStats = {}
): string => {
	if (isInvalidJsonResponse(error)) {
		const saved =
			(stats.imported ?? 0) + (stats.skipped ?? 0) + (stats.failed ?? 0);

		if (saved > 0) {
			return sprintf(
				/* translators: %d: number of contacts already processed before the request died. */
				__(
					'The server stopped the import before it finished (timeout or crash). %d contacts were already processed. Re-import the same file with “Update existing contacts” turned on to continue. A bad email or phone only skips that row — it does not stop the file. If you have an automation that runs when a contact is added, pause it during large imports; it can time the server out.',
					'doublescale'
				),
				saved
			);
		}

		return __(
			'The server stopped the import before it finished. This usually means the request timed out or crashed. Try again. A bad email or phone only skips that row. If you have an automation that runs when a contact is added, pause it during large imports, then re-import with “Update existing contacts” on.',
			'doublescale'
		);
	}

	const typed = error as ApiErrorShape | undefined;
	return (
		typed?.message ||
		__('Failed to import contacts', 'doublescale')
	);
};
