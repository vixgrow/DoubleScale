/**
 * WooCommerce Checkout return-redirect helpers.
 *
 * Woo predates the generic redirect helper and uses `ds_woo_return` rather than
 * the `ds_{slug}_return` convention, so its arg is pinned here. New redirect
 * gateways should use `redirect-payment.ts` directly.
 *
 * @see WooCommerceGateway::RETURN_QUERY_ARG
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
