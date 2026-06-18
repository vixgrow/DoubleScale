/**
 * Helpers for Stripe Payment Element confirm flows (redirect-based methods).
 */

const STRIPE_REDIRECT_PARAMS = [
	'payment_intent',
	'payment_intent_client_secret',
	'redirect_status',
	'setup_intent',
	'setup_intent_client_secret',
] as const;

export type StripeRedirectStatus = 'succeeded' | 'failed' | 'processing';

/** Current page URL without Stripe redirect query params (for return_url). */
export const getStripePaymentReturnUrl = (): string => {
	const url = new URL(window.location.href);
	STRIPE_REDIRECT_PARAMS.forEach((key) => url.searchParams.delete(key));
	return url.toString();
};

export const getStripeRedirectStatus = (): StripeRedirectStatus | null => {
	const status = new URL(window.location.href).searchParams.get('redirect_status');
	if (status === 'succeeded' || status === 'failed' || status === 'processing') {
		return status;
	}
	return null;
};

export const clearStripeRedirectParams = (): void => {
	const url = new URL(window.location.href);
	let changed = false;
	STRIPE_REDIRECT_PARAMS.forEach((key) => {
		if (url.searchParams.has(key)) {
			url.searchParams.delete(key);
			changed = true;
		}
	});
	if (changed) {
		window.history.replaceState({}, '', url.toString());
	}
};
