/**
 * Date/time + money formatting helpers.
 *
 * Booking timestamps are stored UTC as `YYYY-MM-DD HH:MM:SS`; we render them in
 * the customer's stored booking timezone (not site time) via Intl.
 */

const toDate = (value: string): Date | null => {
	if (!value) {
		return null;
	}
	// Treat a space-separated SQL datetime as UTC.
	const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (value: string, timezone?: string): string => {
	const d = toDate(value);
	if (!d) {
		return value || '';
	}
	try {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: timezone || 'UTC',
		}).format(d);
	} catch (e) {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(d);
	}
};

export const formatDate = (value: string, timezone?: string): string => {
	const d = toDate(value);
	if (!d) {
		return value || '';
	}
	try {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeZone: timezone || 'UTC',
		}).format(d);
	} catch (e) {
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
			d
		);
	}
};

export const formatTime = (value: string, timezone?: string): string => {
	const d = toDate(value);
	if (!d) {
		return '';
	}
	try {
		return new Intl.DateTimeFormat(undefined, {
			timeStyle: 'short',
			timeZone: timezone || 'UTC',
		}).format(d);
	} catch (e) {
		return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
			d
		);
	}
};

export const formatMoney = (
	amount: string | number | null,
	currency: string | null
): string => {
	if (amount === null || amount === undefined || amount === '') {
		return '';
	}
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (Number.isNaN(num)) {
		return String(amount);
	}
	if (currency) {
		try {
			return new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency,
			}).format(num);
		} catch (e) {
			// Unknown currency code — fall through to plain number + code.
			return `${num.toFixed(2)} ${currency}`;
		}
	}
	return num.toFixed(2);
};
