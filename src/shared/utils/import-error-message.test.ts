import { describe, expect, it } from 'vitest';

import {
	getImportErrorMessage,
	isInvalidJsonResponse,
} from './import-error-message';

describe('isInvalidJsonResponse', () => {
	it('matches the WordPress api-fetch invalid_json code', () => {
		expect(
			isInvalidJsonResponse({
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			})
		).toBe(true);
	});

	it('matches the stock sentence even without a code', () => {
		expect(
			isInvalidJsonResponse({
				message: 'The response is not a valid JSON response.',
			})
		).toBe(true);
	});

	it('leaves ordinary REST errors alone', () => {
		expect(
			isInvalidJsonResponse({
				code: 'import_error',
				message: 'Email field is required.',
			})
		).toBe(false);
	});
});

describe('getImportErrorMessage', () => {
	it('does not surface the stock WordPress JSON sentence', () => {
		const message = getImportErrorMessage({
			code: 'invalid_json',
			message: 'The response is not a valid JSON response.',
		});

		expect(message).not.toMatch(/not a valid JSON response/i);
		expect(message).toMatch(/timed out|timeout or crash/i);
		expect(message).toMatch(/Update existing contacts/i);
	});

	it('says how many contacts were already processed', () => {
		const message = getImportErrorMessage(
			{
				code: 'invalid_json',
				message: 'The response is not a valid JSON response.',
			},
			{ imported: 740, skipped: 12, failed: 3 }
		);

		expect(message).toMatch(/755 contacts were already processed/);
		expect(message).toMatch(/automation/i);
	});

	it('passes through a real importer error message', () => {
		expect(
			getImportErrorMessage({
				code: 'import_error',
				message: 'Email field is required.',
			})
		).toBe('Email field is required.');
	});
});
