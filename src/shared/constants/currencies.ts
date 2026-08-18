/**
 * Canonical currency list shared by free and Pro bundles.
 *
 * PHP `DoubleScale\Core\Constants\Currencies` is the source of truth — keep
 * `CURRENCY_CODES` in lockstep (see CurrenciesParityTest).
 *
 * Imports `@doublescale/config`, which each webpack bundle aliases to its own
 * ConfigAPI. That seam is what lets one module work in both plugins.
 */
import config from '@doublescale/config';

export const CURRENCY_CODES = [
	'USD',
	'EUR',
	'GBP',
	'JPY',
	'AUD',
	'CAD',
	'CHF',
	'CNY',
	'SEK',
	'NZD',
	'INR',
	'BRL',
	'RUB',
	'ZAR',
	'MXN',
	'SGD',
	'HKD',
	'NGN',
	'NOK',
	'KRW',
	'TRY',
	'DKK',
	'PLN',
	'THB',
	'IDR',
	'HUF',
	'CZK',
	'ILS',
	'CLP',
	'PHP',
	'AED',
	'COP',
	'SAR',
	'MYR',
	'RON',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	JPY: '¥',
	AUD: 'A$',
	CAD: 'C$',
	CHF: 'CHF',
	CNY: '¥',
	SEK: 'kr',
	NZD: 'NZ$',
	INR: '₹',
	BRL: 'R$',
	RUB: '₽',
	ZAR: 'R',
	MXN: 'MX$',
	SGD: 'S$',
	HKD: 'HK$',
	NGN: '₦',
	NOK: 'kr',
	KRW: '₩',
	TRY: '₺',
	DKK: 'kr',
	PLN: 'zł',
	THB: '฿',
	IDR: 'Rp',
	HUF: 'Ft',
	CZK: 'Kč',
	ILS: '₪',
	CLP: 'CLP$',
	PHP: '₱',
	AED: 'د.إ',
	COP: 'COL$',
	SAR: '﷼',
	MYR: 'RM',
	RON: 'lei',
	EGP: 'E£',
};

export const CURRENCY_LABELS: Record<string, string> = {
	USD: 'USD - US Dollar',
	EUR: 'EUR - Euro',
	GBP: 'GBP - British Pound',
	JPY: 'JPY - Japanese Yen',
	AUD: 'AUD - Australian Dollar',
	CAD: 'CAD - Canadian Dollar',
	CHF: 'CHF - Swiss Franc',
	CNY: 'CNY - Chinese Yuan',
	SEK: 'SEK - Swedish Krona',
	NZD: 'NZD - New Zealand Dollar',
	INR: 'INR - Indian Rupee',
	BRL: 'BRL - Brazilian Real',
	RUB: 'RUB - Russian Ruble',
	ZAR: 'ZAR - South African Rand',
	MXN: 'MXN - Mexican Peso',
	SGD: 'SGD - Singapore Dollar',
	HKD: 'HKD - Hong Kong Dollar',
	NGN: 'NGN - Nigerian Naira',
	NOK: 'NOK - Norwegian Krone',
	KRW: 'KRW - South Korean Won',
	TRY: 'TRY - Turkish Lira',
	DKK: 'DKK - Danish Krone',
	PLN: 'PLN - Polish Zloty',
	THB: 'THB - Thai Baht',
	IDR: 'IDR - Indonesian Rupiah',
	HUF: 'HUF - Hungarian Forint',
	CZK: 'CZK - Czech Koruna',
	ILS: 'ILS - Israeli Shekel',
	CLP: 'CLP - Chilean Peso',
	PHP: 'PHP - Philippine Peso',
	AED: 'AED - UAE Dirham',
	COP: 'COP - Colombian Peso',
	SAR: 'SAR - Saudi Riyal',
	MYR: 'MYR - Malaysian Ringgit',
	RON: 'RON - Romanian Leu',
};

export const CURRENCY_OPTIONS = CURRENCY_CODES.map((value) => ({
	value,
	label: CURRENCY_LABELS[value] ?? value,
}));

const ZERO_DECIMAL = new Set([
	'BIF',
	'CLP',
	'DJF',
	'GNF',
	'JPY',
	'KMF',
	'KRW',
	'MGA',
	'PYG',
	'RWF',
	'UGX',
	'VND',
	'VUV',
	'XAF',
	'XOF',
	'XPF',
]);

/** Global currency code (e.g. 'USD', 'BRL'), falling back to USD. */
export const getGlobalCurrency = (): string => config.getCurrency() || 'USD';

/**
 * Symbol for a currency code. Falls back to the global currency when no code is
 * given, and to the raw code when the symbol is unknown.
 */
export const getCurrencySymbol = (code?: string | null): string => {
	const currency = (code || getGlobalCurrency()).toUpperCase();
	return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Format an amount as a symbol-prefixed string (`$1,234.00`).
 */
export const formatMoney = (
	value: number,
	currency?: string | null
): string => {
	const code = (currency || getGlobalCurrency()).toUpperCase();
	const symbol = getCurrencySymbol(code);
	const digits = ZERO_DECIMAL.has(code) ? 0 : 2;
	const amount = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	}).format(Number(value) || 0);
	return `${symbol}${amount}`;
};
