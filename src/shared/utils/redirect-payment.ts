/**
 * Helpers for hosted-checkout return redirects on the invoice payment views.
 *
 * A redirect gateway sends the customer to the provider's own checkout page and
 * appends a marker query arg to the return URL. The marker only says "you are
 * back" — the server `confirm` call is the authority on payment status.
 *
 * The arg itself comes from the gateway's `return_query_arg` in the REST
 * payload (PHP `Gateway::return_query_arg()`), so the two sides can never drift.
 * A gateway with an empty arg does not redirect.
 */

/** Whether this gateway hands off to a hosted checkout. */
export const isRedirectGateway = (returnArg?: string): boolean =>
	typeof returnArg === 'string' && returnArg !== '';

/** Whether the current URL indicates a return from this gateway's checkout. */
export const isRedirectReturn = (returnArg?: string): boolean => {
	if (!isRedirectGateway(returnArg)) {
		return false;
	}
	const value = new URL(window.location.href).searchParams.get(returnArg as string);
	return value === '1' || value === 'true';
};

/** Strip this gateway's return marker from the address bar. */
export const clearRedirectReturnParams = (returnArg?: string): void => {
	if (!isRedirectGateway(returnArg)) {
		return;
	}
	const url = new URL(window.location.href);
	if (!url.searchParams.has(returnArg as string)) {
		return;
	}
	url.searchParams.delete(returnArg as string);
	window.history.replaceState({}, '', url.toString());
};
