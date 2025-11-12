/**
 * Currency formatting utilities for sales pipeline
 */

/**
 * Get currency symbol from ISO currency code
 *
 * @param code - ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
 * @returns Currency symbol or code with space if not found
 */
export const getCurrencySymbol = (code: string): string => {
	const symbols: Record<string, string> = {
		'USD': '$',
		'EUR': '€',
		'GBP': '£',
		'JPY': '¥',
		'CNY': '¥',
		'INR': '₹',
		'AUD': 'A$',
		'CAD': 'C$',
		'CHF': 'CHF',
		'BRL': 'R$',
		'MXN': 'MX$',
		'ZAR': 'R',
		'SEK': 'kr',
		'NOK': 'kr',
		'DKK': 'kr',
		'PLN': 'zł',
		'TRY': '₺',
		'RUB': '₽',
		'AED': 'د.إ',
		'SAR': '﷼',
		'KRW': '₩',
		'THB': '฿',
		'SGD': 'S$',
		'HKD': 'HK$',
		'NZD': 'NZ$',
	};
	return symbols[code] || code + ' ';
};

/**
 * Format currency value with K/M suffixes for large numbers
 *
 * @param value - Numeric value to format
 * @param currencyCode - ISO currency code (defaults to 'USD')
 * @returns Formatted string with currency symbol and K/M suffix
 *
 * @example
 * formatCurrency(5000, 'USD') // '$5K'
 * formatCurrency(1500000, 'EUR') // '€1.5M'
 * formatCurrency(250, 'GBP') // '£250'
 */
export const formatCurrency = (value: number, currencyCode: string = 'USD'): string => {
	const symbol = getCurrencySymbol(currencyCode);

	if (value >= 1_000_000) {
		return `${symbol}${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
	} else if (value >= 1_000) {
		return `${symbol}${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
	} else {
		return `${symbol}${value.toLocaleString()}`;
	}
};

/**
 * Format currency value without abbreviation
 *
 * @param value - Numeric value to format
 * @param currencyCode - ISO currency code (defaults to 'USD')
 * @returns Formatted string with currency symbol and comma separators
 *
 * @example
 * formatCurrencyFull(5000, 'USD') // '$5,000'
 * formatCurrencyFull(1500000, 'EUR') // '€1,500,000'
 */
export const formatCurrencyFull = (value: number, currencyCode: string = 'USD'): string => {
	const symbol = getCurrencySymbol(currencyCode);
	return `${symbol}${value.toLocaleString()}`;
};
