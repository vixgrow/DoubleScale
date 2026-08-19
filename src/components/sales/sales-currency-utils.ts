/**
 * Currency helpers for sales documents.
 *
 * Re-exports the shared constants. `getGlobalCurrency` stays here so existing
 * `@/components/sales/sales-currency-utils` imports keep working.
 *
 * Per-document currency is chosen on the invoice/proposal/contract/credit-note
 * form. This module no longer owns a private symbol map.
 */
export {
	getGlobalCurrency,
	getCurrencySymbol,
} from '@/constants/currencies';
