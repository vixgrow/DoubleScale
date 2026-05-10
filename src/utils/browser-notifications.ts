import type { Notification } from '@doublescale/services/notification-service';
import type { NotificationPreferences } from '@doublescale/services/notification-preferences-service';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function isBrowserNotificationSupported(): boolean {
	return 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
	if (!isBrowserNotificationSupported()) {
		return 'denied';
	}
	return Notification.permission as NotificationPermission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
	if (!isBrowserNotificationSupported()) {
		return 'denied';
	}

	try {
		const permission = await Notification.requestPermission();
		return permission as NotificationPermission;
	} catch (error) {
		console.error('Failed to request notification permission:', error);
		return 'denied';
	}
}

export function isTabFocused(): boolean {
	return document.hasFocus();
}

export function showBrowserNotification(
	notification: Notification,
	options: {
		ignoreFocus?: boolean;
		onClick?: () => void | Promise<void>;
		icon?: string;
		onPermissionRevoked?: () => void;
	} = {}
): globalThis.Notification | null {
	if (!isBrowserNotificationSupported()) {
		return null;
	}

	const permission = getBrowserNotificationPermission();
	if (permission !== 'granted') {
		return null;
	}

	if (!options.ignoreFocus && isTabFocused()) {
		return null;
	}

	try {
		const notificationOptions: NotificationOptions = {
			body: notification.message,
			tag: `doublescale-${notification.id}`,
			requireInteraction: false,
		};

		if (options.icon) {
			notificationOptions.icon = options.icon;
			notificationOptions.badge = options.icon;
		}

		const browserNotification = new Notification(notification.title, notificationOptions);

		browserNotification.onclick = () => {
			(async () => {
				try {
					window.focus();
				} catch (ex) {
					console.warn('Could not focus window:', ex);
				}

				if (options.onClick) {
					try {
						await options.onClick();
					} catch {
						// Still navigate even if callback fails
					}
				}

				if (notification.link) {
					window.location.href = notification.link;
				}

				browserNotification.close();
			})();
		};

		browserNotification.onclose = () => {
			// Cleanup if needed
		};

		browserNotification.onerror = (error) => {
			console.error('Browser notification error:', error);
		};

		return browserNotification;
	} catch (error) {
		console.error('Failed to show browser notification:', error);

		if (error instanceof Error) {
			const currentPermission = getBrowserNotificationPermission();
			if (currentPermission !== 'granted') {
				console.warn('[DoubleScale] Permission appears to have been revoked. Current:', currentPermission);
				if (options.onPermissionRevoked) {
					options.onPermissionRevoked();
				}
			}
		}

		return null;
	}
}

export function showTestBrowserNotification(): globalThis.Notification | null {
	if (!isBrowserNotificationSupported()) {
		return null;
	}

	const permission = getBrowserNotificationPermission();
	if (permission !== 'granted') {
		return null;
	}

	try {
		const uniqueTag = `doublescale-test-${Date.now()}`;

		const browserNotification = new window.Notification('DoubleScale Notifications', {
			body: "Browser notifications are working! You'll see these when DoubleScale is open but not focused.",
			tag: uniqueTag,
			requireInteraction: false,
		});

		browserNotification.onclick = () => {
			window.focus();
			browserNotification.close();
		};

		return browserNotification;
	} catch (error) {
		return null;
	}
}

export function getPermissionStatusMessage(
	permission: NotificationPermission
): string {
	switch (permission) {
		case 'granted':
			return 'Browser notifications are enabled';
		case 'denied':
			return 'Browser notifications are blocked. Please enable them in your browser settings.';
		case 'default':
			return 'Click "Enable" to allow browser notifications';
		default:
			return 'Unknown permission status';
	}
}

export function isBrowserEnabledForSubcategory(
	subcategory: string | null,
	preferences: NotificationPreferences
): boolean {
	if (!preferences.channels.browser) {
		return false;
	}

	if (!subcategory) {
		return true;
	}

	const subPrefs = preferences.subcategories[subcategory];
	if (!subPrefs) {
		return true;
	}

	return subPrefs.browser === true;
}
