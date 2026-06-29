import { __ } from '@wordpress/i18n';

export const PERCENT_DISCOUNT_TYPES = ['percent', 'before_tax', 'after_tax'] as const;

export const isPercentDiscountType = (type: string): boolean =>
	PERCENT_DISCOUNT_TYPES.includes(type as (typeof PERCENT_DISCOUNT_TYPES)[number]);

export const getDiscountValidationError = (
	type: string,
	value: number,
	subtotal?: number
): string | null => {
	if (type === 'none' || !value) {
		return null;
	}

	if (!Number.isFinite(value) || value < 0) {
		return __('Discount cannot be negative.', 'doublescale');
	}

	if (isPercentDiscountType(type) && value > 100) {
		return __('Discount percentage cannot exceed 100%.', 'doublescale');
	}

	if (type === 'fixed' && subtotal !== undefined && value > subtotal) {
		return __('Fixed discount cannot exceed the document subtotal.', 'doublescale');
	}

	return null;
};

export const parseDiscountInput = (raw: string): number => {
	if (raw.trim() === '') {
		return 0;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : 0;
};
