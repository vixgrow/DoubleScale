/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Smartphone, Apple, QrCode, ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.doublescale.app';
const IOS_URL = 'https://apps.apple.com/app/doublescale/id0000000000';

const PlayStoreIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="currentColor">
		<path d="M3.609 1.814L13.792 12 3.61 22.186a2.37 2.37 0 0 1-.86-.481 1.868 1.868 0 0 1-.611-1.467V3.762c0-.605.223-1.105.611-1.467.18-.174.491-.367.859-.481zM14.852 13.06l2.706 2.706-9.242 5.303 6.536-8.009zm3.636-3.636l2.039 1.17c.67.384 1.035.853 1.035 1.406 0 .553-.365 1.022-1.035 1.407l-2.04 1.17-2.97-2.577 2.97-2.576zM8.316 2.931l9.242 5.303-2.706 2.706-6.536-8.009z" />
	</svg>
);

const DownloadCard: React.FC<{
	platform: 'ios' | 'android';
	url: string;
}> = ({ platform, url }) => {
	const isIOS = platform === 'ios';

	return (
		<div className="flex flex-col items-center gap-5 rounded-xl border border-border/60 bg-card p-8 flex-1">
			<div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${isIOS ? 'bg-foreground text-background' : 'bg-emerald-50 text-emerald-700'}`}>
				{isIOS ? <Apple size={32} /> : <PlayStoreIcon className="w-8 h-8" />}
			</div>

			<div className="text-center">
				<h3 className="text-base font-semibold text-foreground">
					{isIOS ? __('iOS App', 'doublescale') : __('Android App', 'doublescale')}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">
					{isIOS
						? __('Available on the App Store for iPhone and iPad.', 'doublescale')
						: __('Available on Google Play for all Android devices.', 'doublescale')
					}
				</p>
			</div>

			<div className="flex items-center justify-center w-36 h-36 rounded-xl border border-border/60 bg-muted/30">
				<div className="flex flex-col items-center gap-2 text-muted-foreground">
					<QrCode size={48} strokeWidth={1} />
					<span className="text-[10px] font-medium">{__('Scan to download', 'doublescale')}</span>
				</div>
			</div>

			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="w-full"
			>
				<Button
					variant={isIOS ? 'default' : 'outline'}
					className="w-full gap-2"
				>
					<ExternalLink size={14} />
					{isIOS ? __('Download on App Store', 'doublescale') : __('Get it on Google Play', 'doublescale')}
				</Button>
			</a>
		</div>
	);
};

const MobileAppSettings: React.FC = () => {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
				<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
					<Smartphone size={20} />
				</div>
				<div>
					<h3 className="text-sm font-semibold text-foreground">
						{__('DoubleScale Mobile App', 'doublescale')}
					</h3>
					<p className="text-sm text-muted-foreground mt-0.5">
						{__('Manage your CRM on the go. Access contacts, deals, tasks, and more from your mobile device. Scan the QR code or click the download button to get started.', 'doublescale')}
					</p>
				</div>
			</div>

			<div className="flex gap-5">
				<DownloadCard platform="ios" url={IOS_URL} />
				<DownloadCard platform="android" url={ANDROID_URL} />
			</div>

			<div className="rounded-xl border border-border/60 bg-card p-5">
				<h4 className="text-sm font-semibold text-foreground mb-3">
					{__('Getting Started', 'doublescale')}
				</h4>
				<ol className="space-y-2.5 text-sm text-muted-foreground list-decimal list-inside">
					<li>{__('Download the DoubleScale app from your device\'s app store.', 'doublescale')}</li>
					<li>{__('Open the app and enter your WordPress site URL.', 'doublescale')}</li>
					<li>{__('Log in with your WordPress admin credentials.', 'doublescale')}</li>
					<li>{__('Start managing your CRM on the go!', 'doublescale')}</li>
				</ol>
			</div>
		</div>
	);
};

export default MobileAppSettings;
