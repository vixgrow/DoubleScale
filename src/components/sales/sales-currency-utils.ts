/**
 * Currency helpers for sales documents.
 *
 * Currency is a single global setting (Settings → Currencies). These helpers let
 * forms show which currency the amounts are in — the same way deals display the
 * currency symbol next to the value — now that per-document currency pickers are
 * gone.
 */
import config from '@doublescale/config';

const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	JPY: '¥',
	CNY: '¥',
	INR: '₹',
	AUD: 'A$',
	CAD: 'C$',
	CHF: 'CHF',
	BRL: 'R$',
	MXN: 'MX$',
	ZAR: 'R',
	SEK: 'kr',
	NZD: 'NZ$',
	NGN: '₦',
	NOK: 'kr',
	DKK: 'kr',
	PLN: 'zł',
	TRY: '₺',
	RUB: '₽',
	AED: 'د.إ',
	SAR: '﷼',
	KRW: '₩',
	THB: '฿',
	SGD: 'S$',
	HKD: 'HK$',
	IDR: 'Rp',
	HUF: 'Ft',
	CZK: 'Kč',
	ILS: '₪',
	CLP: 'CLP$',
	PHP: '₱',
	COP: 'COL$',
	MYR: 'RM',
	RON: 'lei',
};

/** Global currency code (e.g. 'USD', 'BRL'), falling back to USD. */
export const getGlobalCurrency = (): string => config.getCurrency() || 'USD';

/**
 * Symbol for a currency code. Falls back to the global currency when no code is
 * given, and to the raw code when the symbol is unknown.
 */
export const getCurrencySymbol = (code?: string): string => {
	const currency = code || getGlobalCurrency();
	return CURRENCY_SYMBOLS[currency] || currency;
};
