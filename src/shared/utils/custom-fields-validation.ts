import { __, sprintf } from '@wordpress/i18n';

export type CrmCustomFieldLike = {
	id: number;
	name: string;
	type: string;
	attributes?: unknown;
};

export type CrmCustomFieldAttributesMeta = {
	options: string[];
	required: boolean;
};

export const normalizeCustomFieldOptionValue = (option: unknown): string => {
	if (typeof option === 'string' || typeof option === 'number') {
		return String(option).trim();
	}

	if (option && typeof option === 'object') {
		const record = option as Record<string, unknown>;
		const value = record.value ?? record.label ?? '';
		return String(value).trim();
	}

	return '';
};

export const normalizeCustomFieldOptionValues = (
	options: unknown[]
): string[] =>
	options.map(normalizeCustomFieldOptionValue).filter(Boolean);

export const getCustomFieldAttributesMeta = (
	attributes: unknown
): CrmCustomFieldAttributesMeta => {
	if (!attributes) {
		return { options: [], required: false };
	}

	if (Array.isArray(attributes)) {
		return {
			options: normalizeCustomFieldOptionValues(attributes),
			required: false,
		};
	}

	if (typeof attributes === 'object' && attributes !== null) {
		const record = attributes as Record<string, unknown>;
		const rawOptions = record.options;
		const options = Array.isArray(rawOptions)
			? normalizeCustomFieldOptionValues(rawOptions)
			: [];

		return {
			options,
			required: !!record.required,
		};
	}

	return { options: [], required: false };
};

export const isCustomFieldRequired = (field: CrmCustomFieldLike): boolean =>
	getCustomFieldAttributesMeta(field.attributes).required;

export const buildCustomFieldAttributesPayload = (
	type: string,
	options: string[],
	required: boolean
): Record<string, unknown> => {
	const needsOptions =
		type === 'select' ||
		type === 'multiselect' ||
		type === 'radio' ||
		type === 'checkbox';
	const validOptions = options.map((option) => option.trim()).filter(Boolean);

	if (needsOptions) {
		return {
			options: validOptions,
			required,
		};
	}

	// Always persist `required`, including `false`, so unchecking the flag
	// clears the stored required state instead of leaving attributes unchanged.
	return { required };
};

export const isEmptyCrmCustomFieldValue = (
	value: unknown,
	type: string
): boolean => {
	if (type === 'multiselect' || type === 'checkbox') {
		if (!Array.isArray(value)) {
			return !value || String(value).trim() === '';
		}
		return value.length === 0;
	}

	if (type === 'boolean') {
		if (value === true || value === 'true') {
			return false;
		}
		return true;
	}

	if (value === null || value === undefined) {
		return true;
	}

	return String(value).trim() === '';
};

export const isValidCrmCustomFieldValue = (
	field: CrmCustomFieldLike,
	value: unknown
): boolean => {
	if (isEmptyCrmCustomFieldValue(value, field.type)) {
		return true;
	}

	const { options } = getCustomFieldAttributesMeta(field.attributes);

	if (field.type === 'select' || field.type === 'radio') {
		return options.includes(String(value).trim());
	}

	if (field.type === 'multiselect' || field.type === 'checkbox') {
		const selected = Array.isArray(value)
			? value.map((item) => String(item).trim()).filter(Boolean)
			: String(value)
					.split(',')
					.map((item) => item.trim())
					.filter(Boolean);

		return selected.every((item) => options.includes(item));
	}

	return true;
};

export const validateCrmCustomFields = (
	groups: Array<{ custom_fields?: CrmCustomFieldLike[] }>,
	values: Record<number, unknown>
): Record<number, string> => {
	const errors: Record<number, string> = {};

	for (const group of groups) {
		for (const field of group.custom_fields || []) {
			const value = values[field.id];

			if (isCustomFieldRequired(field) && isEmptyCrmCustomFieldValue(value, field.type)) {
				errors[field.id] = sprintf(
					/* translators: %s: field label */
					__('The field "%s" is required.', 'doublescale'),
					field.name
				);
				continue;
			}

			if (!isValidCrmCustomFieldValue(field, value)) {
				errors[field.id] = sprintf(
					/* translators: %s: field label */
					__('The field "%s" has an invalid value.', 'doublescale'),
					field.name
				);
			}
		}
	}

	return errors;
};

export const formatCustomFieldsForApi = (
	values: Record<number, unknown> | Record<string, unknown> | undefined
): Array<{ id: number; value: string }> => {
	if (!values || typeof values !== 'object') {
		return [];
	}

	return Object.entries(values)
		.filter(([, value]) => value !== undefined)
		.map(([id, value]) => ({
			id: Number(id),
			value:
				typeof value === 'boolean'
					? String(value)
					: Array.isArray(value)
						? value.join(',')
						: String(value ?? ''),
		}))
		.filter((field) => !Number.isNaN(field.id));
};

export const mapCrmCustomFieldRestError = (
	err: unknown,
	groups: Array<{ custom_fields?: CrmCustomFieldLike[] }>
): Record<number, string> => {
	const error = err as {
		code?: string;
		message?: string;
		data?: { field_id?: number };
	};

	if (
		(error.code !== 'custom_field_required' &&
			error.code !== 'custom_field_invalid') ||
		!error.message
	) {
		return {};
	}

	const fieldId = Number(error.data?.field_id ?? 0);
	if (fieldId) {
		const field = groups
			.flatMap((group) => group.custom_fields || [])
			.find((item) => item.id === fieldId);

		if (field) {
			return {
				[fieldId]: sprintf(
					/* translators: %s: field label */
					__('The field "%s" is required.', 'doublescale'),
					field.name
				),
			};
		}
	}

	const quoted = error.message.match(/"([^"]+)"/);
	const label = quoted?.[1] ?? '';
	if (!label) {
		return {};
	}

	const field = groups
		.flatMap((group) => group.custom_fields || [])
		.find((item) => item.name === label);

	if (!field) {
		return {};
	}

	return {
		[field.id]: error.message,
	};
};
