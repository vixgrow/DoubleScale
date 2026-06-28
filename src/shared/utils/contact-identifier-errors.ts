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
	};
};

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

	return {
		message: error?.message || __('Something went wrong.', 'doublescale'),
	};
}
