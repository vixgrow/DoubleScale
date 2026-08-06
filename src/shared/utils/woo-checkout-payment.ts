/**
 * Helpers for WooCommerce Checkout return-from-payment redirects on the public invoice page.
 */

export const WOO_RETURN_QUERY_ARG = 'ds_woo_return';

/** Whether the current URL indicates a return from WooCommerce checkout. */
export const isWooCheckoutReturn = (): boolean => {
	const value = new URL(window.location.href).searchParams.get(WOO_RETURN_QUERY_ARG);
	return value === '1' || value === 'true';
};

/** Strip the WooCommerce return query arg from the address bar. */
export const clearWooCheckoutReturnParams = (): void => {
	const url = new URL(window.location.href);
	if (!url.searchParams.has(WOO_RETURN_QUERY_ARG)) {
		return;
	}
	url.searchParams.delete(WOO_RETURN_QUERY_ARG);
	window.history.replaceState({}, '', url.toString());
};
