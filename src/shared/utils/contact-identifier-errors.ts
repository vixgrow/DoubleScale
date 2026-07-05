import { __ } from '@wordpress/i18n';

export type ContactIdentifierField = 'email' | 'phone' | 'whatsapp_phone';

export type ContactIdentifierError = {
	field?: ContactIdentifierField;
	message: string;
};

type ApiFetchError = {
	code?: string;
	message?: string;
	data?: {
		field?: ContactIdentifierField;
		status?: number;
		// WP core sets these on `rest_invalid_param` errors: the map of
		// offending params → their per-param error message.
		params?: Record<string, string>;
		details?: Record<string, { message?: string }>;
	};
};

const IDENTIFIER_FIELDS: ContactIdentifierField[] = [
	'email',
	'phone',
	'whatsapp_phone',
];

/**
 * Extract a per-field error from a WP `rest_invalid_param` response.
 *
 * WP core validation (arg `validate_callback`) rejects with code
 * `rest_invalid_param` and a generic top-level message ("Invalid
 * parameter(s): whatsapp_phone"). The useful, field-specific message lives
 * under `data.params[field]` / `data.details[field].message`. Surface the
 * first identifier field found so callers can highlight it inline.
 */
function mapRestInvalidParam(
	error: ApiFetchError
): ContactIdentifierError | null {
	if (error?.code !== 'rest_invalid_param') {
		return null;
	}

	const params = error?.data?.params ?? {};
	const details = error?.data?.details ?? {};

	for (const field of IDENTIFIER_FIELDS) {
		const message = params[field] || details[field]?.message;
		if (message) {
			return { field, message };
		}
	}

	return null;
}

const IDENTIFIER_ERROR_CODES: Record<
	string,
	{ field: ContactIdentifierField; message: string }
> = {
	email_exists: {
		field: 'email',
		message: __(
			'A contact with this email address already exists.',
			'doublescale'
		),
	},
	phone_exists: {
		field: 'phone',
		message: __(
			'A contact with this phone number already exists.',
			'doublescale'
		),
	},
	whatsapp_phone_exists: {
		field: 'whatsapp_phone',
		message: __(
			'A contact with this WhatsApp number already exists.',
			'doublescale'
		),
	},
	contact_exists: {
		field: 'email',
		message: __('Contact already exists.', 'doublescale'),
	},
};

export function mapContactIdentifierError(
	error: ApiFetchError | null | undefined
): ContactIdentifierError {
	const code = error?.code ?? '';
	const mapped = IDENTIFIER_ERROR_CODES[code];

	if (mapped) {
		return {
			field: error?.data?.field ?? mapped.field,
			message: error?.message || mapped.message,
		};
	}

	// Field-level validation failures (e.g. WhatsApp phone not in E.164 format)
	// arrive as `rest_invalid_param` with the specific message nested in `data`.
	const invalidParam = error ? mapRestInvalidParam(error) : null;
	if (invalidParam) {
		return invalidParam;
	}

	return {
		message: error?.message || __('Something went wrong.', 'doublescale'),
	};
}
