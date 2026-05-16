/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Smartphone, X, Apple } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.doublescale.app';
const IOS_URL = 'https://apps.apple.com/app/doublescale/id0000000000';

const PlayStoreIcon = () => (
	<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
		<path d="M3.609 1.814L13.792 12 3.61 22.186a2.37 2.37 0 0 1-.86-.481 1.868 1.868 0 0 1-.611-1.467V3.762c0-.605.223-1.105.611-1.467.18-.174.491-.367.859-.481zM14.852 13.06l2.706 2.706-9.242 5.303 6.536-8.009zm3.636-3.636l2.039 1.17c.67.384 1.035.853 1.035 1.406 0 .553-.365 1.022-1.035 1.407l-2.04 1.17-2.97-2.577 2.97-2.576zM8.316 2.931l9.242 5.303-2.706 2.706-6.536-8.009z" />
	</svg>
);

export const MobileAppCard: React.FC = () => {
	const [dismissed, setDismissed] = useState(() => {
		try {
			return localStorage.getItem('doublescale_mobile_app_dismissed') === '1';
		} catch {
			return false;
		}
	});

	if (dismissed) return null;

	const handleDismiss = () => {
		setDismissed(true);
		try {
			localStorage.setItem('doublescale_mobile_app_dismissed', '1');
		} catch { }
	};

	return (
		<div className="relative overflow-hidden rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] bg-[#fff] p-6">
			<button
				onClick={handleDismiss}
				className="absolute top-3 right-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primaryText"
				aria-label={__('Dismiss', 'doublescale')}
			>
				<X size={16} />
			</button>

			<div className="flex items-center gap-5">
				<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
					<Smartphone size={24} />
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-semibold text-primaryText">
						{__('Take DoubleScale on the go', 'doublescale')}
					</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{__('Manage contacts, deals, and tasks from your mobile device.', 'doublescale')}
					</p>
				</div>

				<div className="flex items-center justify-center mt-3 gap-2 shrink-0">
					<a
						href={IOS_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
					>
						<Apple size={14} />
						{__('App Store', 'doublescale')}
					</a>
					<a
						href={ANDROID_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card text-xs font-medium text-primaryText transition-colors hover:bg-muted/50"
					>
						<PlayStoreIcon />
						{__('Google Play', 'doublescale')}
					</a>
				</div>
			</div>
		</div>
	);
};
