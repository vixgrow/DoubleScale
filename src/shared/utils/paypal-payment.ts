/**
 * PayPal JS SDK loader — no npm dependency.
 */

declare global {
	interface Window {
		paypal?: {
			Buttons: (config: Record<string, unknown>) => {
				render: (selector: string | HTMLElement) => Promise<void>;
				close: () => void;
			};
		};
	}
}

const scriptCache = new Map<string, Promise<void>>();

export const loadPayPalScript = (clientId: string, currency: string): Promise<void> => {
	const key = `${clientId}:${currency}`;
	const cached = scriptCache.get(key);
	if (cached) {
		return cached;
	}

	const promise = new Promise<void>((resolve, reject) => {
		if (window.paypal) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load PayPal SDK.'));
		document.body.appendChild(script);
	});

	scriptCache.set(key, promise);
	return promise;
};
