/**
 * Notification Preferences Settings Page
 *
 * HubSpot-style layout with two sub-tabs:
 * - "Email & Desktop": Bell/Email/Browser channels with all categories
 * - "Mobile app": Push preferences for mobile-relevant categories only
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useNotificationPreferences } from '@doublescale/hooks/use-notification-preferences';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import ConfigAPI from '@/config';
import { Card, CardContent } from '@/components/ui/card';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, CheckCheck, X } from 'lucide-react';
import {
	isBrowserNotificationSupported,
	getBrowserNotificationPermission,
	requestBrowserNotificationPermission,
	showTestBrowserNotification,
	type NotificationPermission,
} from '@doublescale/utils/browser-notifications';
import {
	ContactsIcon,
	CampaignsIcon,
	AutomationsIcon,
	PiplelinesIcon,
	SettingsIcon as SystemIcon,
	TaskDoneIcon as TasksIcon,
	SalesIcon,
	ProjectsIcon,
	NotificationIcon,
	ContactTotalEmailsIcon,
	InfoIcon,
	EditHeaderIcon,
	MobileNotificationsIcon,
	FormsIcon,
	IntegrationsIcon,
	ProcessingEmailsIcon,
} from '@doublescale/components';
import { UpcomingCalendarIcon } from '@/components/booking';
import { SupportIcon } from '@/components/support';
import NotificationRetentionSettings, {
	type NotificationRetentionHandle,
} from './notification-retention-settings';
import { SalesNotificationTemplateDialog } from './sales-notification-template-dialog';
import config from '@doublescale/config';

// ──────────────────────────────────────────────────────
// Custom inline SVG icons provided by design
// ──────────────────────────────────────────────────────
function IconDatabase({ size = 37 }: { size?: number }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 37 37" fill="none">
			<path d="M17.7772 31.9856C17.2551 31.9312 16.7322 31.8869 16.2122 31.8211C13.9063 31.5278 11.6762 30.9907 9.67856 29.7361C9.06203 29.3492 8.51201 28.8836 8.10075 28.2728C7.84255 27.8894 7.64586 27.4724 7.63799 27.009C7.6194 25.9318 7.63227 24.8547 7.63227 23.7518C7.67304 23.7718 7.70665 23.7797 7.72668 23.7997C8.73373 24.8561 9.98182 25.5284 11.3222 26.047C13.249 26.7922 15.2553 27.1627 17.3101 27.2929C20.0717 27.4674 22.796 27.2607 25.4588 26.4725C26.9808 26.0219 28.4227 25.399 29.6658 24.384C29.9054 24.1881 30.1257 23.9685 30.3825 23.7339C30.3904 23.8383 30.4004 23.9134 30.4004 23.9878C30.4018 24.791 30.3682 25.5956 30.409 26.3967C30.4676 27.5633 29.9605 28.4401 29.1101 29.1654C28.0251 30.0895 26.7462 30.6452 25.4052 31.0679C23.8274 31.5657 22.2066 31.8411 20.5544 31.9355C20.4493 31.9412 20.3449 31.9691 20.2404 31.9863H17.7779L17.7772 31.9856ZM12.2656 28.4702C12.2699 28.1719 12.0238 27.918 11.7327 27.9209C11.4559 27.923 11.2077 28.1755 11.2077 28.4552C11.2077 28.7362 11.4509 28.983 11.7327 28.9873C12.0188 28.9916 12.2613 28.757 12.2649 28.4702H12.2656ZM9.95106 27.3036C9.95965 27.0204 9.7272 26.7779 9.43681 26.7679C9.14499 26.7579 8.9011 26.9789 8.88822 27.265C8.87463 27.5654 9.10852 27.8114 9.41106 27.8143C9.70073 27.8172 9.94177 27.589 9.95035 27.3036H9.95106Z" fill="#0D9DFC"/>
			<path opacity="0.4" d="M19.4363 14.912C16.5446 14.8799 14.1235 14.5873 11.7968 13.7269C10.6017 13.2849 9.47589 12.7191 8.56968 11.7929C8.11909 11.3323 7.77935 10.8044 7.66491 10.1586C7.51114 9.29387 7.8144 8.5629 8.35654 7.91347C9.05891 7.07163 9.97727 6.52662 10.9586 6.08389C12.487 5.39512 14.1013 5.01175 15.7585 4.78574C17.061 4.60836 18.3677 4.54041 19.6794 4.58047C22.2614 4.65843 24.7834 5.04895 27.1572 6.13038C28.1049 6.56167 28.9825 7.1031 29.6627 7.91418C30.6483 9.08931 30.6361 10.4375 29.6269 11.5969C28.7844 12.5646 27.6872 13.1497 26.52 13.6153C24.9729 14.2319 23.3593 14.5873 21.7043 14.7454C20.8088 14.8312 19.9097 14.8784 19.437 14.9128L19.4363 14.912Z" fill="#0D9DFC"/>
			<path opacity="0.4" d="M30.3948 18.0439C30.3948 19.1239 30.4149 20.1667 30.3884 21.2088C30.3676 22.0221 29.9435 22.6608 29.382 23.2129C28.5266 24.0526 27.4867 24.5933 26.3838 25.0232C24.8146 25.6354 23.1831 25.978 21.5109 26.1561C18.7172 26.4537 15.9578 26.282 13.2428 25.5517C11.7465 25.1498 10.3153 24.5869 9.08509 23.612C8.44638 23.1063 7.91067 22.5148 7.70397 21.6959C7.6539 21.4992 7.62243 21.2918 7.621 21.0894C7.61242 20.126 7.61671 19.1625 7.61743 18.1991C7.61743 18.1569 7.62315 18.1147 7.62815 18.0425C7.94214 18.3164 8.22109 18.5861 8.52578 18.8221C9.85898 19.8527 11.391 20.4657 13.0003 20.8984C15.4128 21.5471 17.8718 21.7495 20.3636 21.6165C22.465 21.5042 24.5206 21.1588 26.4996 20.4249C27.9158 19.8999 29.234 19.2097 30.2961 18.1018C30.3126 18.0847 30.339 18.0761 30.3955 18.0432L30.3948 18.0439ZM9.94695 21.4899C9.95196 21.2017 9.71879 20.9599 9.42983 20.9521C9.13873 20.9442 8.89698 21.1731 8.8884 21.4635C8.88053 21.7531 9.11227 21.9934 9.40409 21.9992C9.70162 22.0049 9.94266 21.7796 9.94695 21.4906V21.4899ZM11.7393 23.16C12.0383 23.1614 12.2643 22.939 12.2665 22.6429C12.2686 22.3489 12.0412 22.1208 11.7443 22.1193C11.4432 22.1172 11.2172 22.3382 11.2158 22.6364C11.2143 22.9325 11.4411 23.1593 11.7386 23.16H11.7393Z" fill="#0D9DFC"/>
			<path d="M30.3885 12.4157C30.3885 13.4528 30.4099 14.5213 30.3806 15.5885C30.362 16.2672 30.0194 16.8287 29.5703 17.32C28.7127 18.2563 27.622 18.8356 26.4626 19.2962C24.6094 20.0322 22.6747 20.397 20.692 20.5322C18.3561 20.6917 16.0437 20.5479 13.765 19.99C12.0763 19.5766 10.4549 18.9987 9.06946 17.9022C8.43791 17.4023 7.91435 16.8136 7.70479 16.0061C7.67117 15.8774 7.63613 15.7444 7.63541 15.6128C7.62969 14.5356 7.63255 13.4592 7.63255 12.3706C7.66259 12.3778 7.69335 12.3763 7.70694 12.3906C8.7662 13.5 10.0844 14.1902 11.4984 14.7209C13.0826 15.3152 14.7263 15.65 16.4063 15.8252C18.3303 16.0255 20.2529 16.0133 22.1697 15.7623C24.4642 15.4619 26.6857 14.9075 28.6805 13.6795C29.282 13.309 29.8227 12.8391 30.3899 12.4164L30.3885 12.4157ZM9.9492 15.6607C9.94634 15.381 9.69887 15.1328 9.42064 15.13C9.13169 15.1271 8.87921 15.3889 8.8885 15.6807C8.8978 15.9661 9.14241 16.1985 9.42779 16.1928C9.71103 16.1871 9.95278 15.9403 9.94991 15.6607H9.9492ZM11.733 16.2965C11.4498 16.2987 11.2166 16.5447 11.2237 16.8358C11.2309 17.1291 11.4691 17.3637 11.7545 17.3587C12.0348 17.3537 12.2701 17.104 12.2658 16.8158C12.2616 16.5283 12.0212 16.2944 11.733 16.2965Z" fill="#0D9DFC"/>
		</svg>
	);
}

function IconInApp({ size = 32 }: { size?: number }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill="none">
			<path d="M24.481 18.9886L23.281 16.9966C23.029 16.5526 22.801 15.7126 22.801 15.2206V12.1846C22.801 8.27257 19.621 5.08057 15.697 5.08057C11.7731 5.08057 8.59308 8.27257 8.59308 12.1846V15.2206C8.59308 15.7126 8.36508 16.5526 8.11308 16.9846L6.90108 18.9886C6.42108 19.7926 6.31308 20.6806 6.61308 21.4966C6.90108 22.3006 7.58508 22.9246 8.47308 23.2246C10.8011 24.0166 13.2491 24.4006 15.697 24.4006C18.145 24.4006 20.593 24.0166 22.921 23.2366C23.761 22.9606 24.409 22.3246 24.721 21.4966C25.033 20.6686 24.949 19.7566 24.481 18.9886Z" fill="#FFD242"/>
			<path opacity="0.4" d="M18.3727 5.584C17.5447 5.26 16.6447 5.08 15.6967 5.08C14.7607 5.08 13.8607 5.248 13.0327 5.584C13.5487 4.612 14.5687 4 15.6967 4C16.8367 4 17.8447 4.612 18.3727 5.584Z" fill="#FFD242"/>
			<path opacity="0.4" d="M19.0696 25.6121C18.5656 27.0041 17.2336 28.0001 15.6736 28.0001C14.7256 28.0001 13.7896 27.6161 13.1296 26.9321C12.7456 26.5721 12.4576 26.0921 12.2896 25.6001C12.4456 25.6241 12.6016 25.6361 12.7696 25.6601C13.0456 25.6961 13.3336 25.7321 13.6216 25.7561C14.3056 25.8161 15.0016 25.8521 15.6976 25.8521C16.3816 25.8521 17.0656 25.8161 17.7376 25.7561C17.9896 25.7321 18.2416 25.7201 18.4816 25.6841C18.6736 25.6601 18.8656 25.6361 19.0696 25.6121Z" fill="#FFD242"/>
			<path d="M22.8729 11.2C24.8612 11.2 26.4729 9.58822 26.4729 7.6C26.4729 5.61178 24.8612 4 22.8729 4C20.8847 4 19.2729 5.61178 19.2729 7.6C19.2729 9.58822 20.8847 11.2 22.8729 11.2Z" fill="#29292E"/>
		</svg>
	);
}

function IconBrowser({ size = 32 }: { size?: number }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill="none">
			<path fillRule="evenodd" clipRule="evenodd" d="M25.721 5.3335V17.8792H6.30273V5.3335H25.721Z" fill="currentColor"/>
			<path d="M26.4661 19.2897L25.462 19.087L24.7765 19.9752C24.651 20.1345 24.4483 20.2117 24.2504 20.1731C24.0525 20.1345 23.8932 19.9848 23.8401 19.7917L22.6768 15.5245C22.6237 15.3411 22.6767 15.1432 22.8119 15.008C22.947 14.8728 23.1449 14.8197 23.3284 14.8728L27.5957 16.0362C27.7887 16.0893 27.9384 16.2486 27.977 16.4465C28.0156 16.6444 27.9384 16.8472 27.7791 16.9727L26.8909 17.6581L27.0936 18.6622C27.1274 18.836 27.0743 19.0194 26.9488 19.1449C26.8233 19.2704 26.6399 19.3235 26.4661 19.2897Z" fill="currentColor"/>
			<path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M5.39964 19.6782L4 22.4848V25.8911H6.51875L25.4813 25.9031H28V22.4728L26.6063 19.6782H5.39964ZM12.4895 21.585H19.4941V23.3841H12.4895V21.585Z" fill="currentColor"/>
		</svg>
	);
}

function IconMobile({ size = 24 }: { size?: number }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
			<path opacity="0.4" d="M16.0162 3H8.38424C5.90024 3 5.00024 3.9 5.00024 6.429V17.571C5.00024 20.1 5.90024 21 8.38424 21H16.0072C18.5002 21 19.4002 20.1 19.4002 17.571V6.429C19.4002 3.9 18.5002 3 16.0162 3Z" fill="currentColor"/>
			<path d="M14.0003 6.8251H10.4003C10.0313 6.8251 9.72534 6.5191 9.72534 6.1501C9.72534 5.7811 10.0313 5.4751 10.4003 5.4751H14.0003C14.3693 5.4751 14.6753 5.7811 14.6753 6.1501C14.6753 6.5191 14.3693 6.8251 14.0003 6.8251Z" fill="currentColor"/>
			<path d="M12.2005 18.5707C13.0703 18.5707 13.7755 17.8655 13.7755 16.9957C13.7755 16.1258 13.0703 15.4207 12.2005 15.4207C11.3306 15.4207 10.6255 16.1258 10.6255 16.9957C10.6255 17.8655 11.3306 18.5707 12.2005 18.5707Z" fill="currentColor"/>
		</svg>
	);
}

// Accent colour per category, keyed by the category slugs returned by
// NotificationCategories::get_all(). Categories left out here inherit the
// surrounding text colour.
const CATEGORY_COLORS: Record<string, string> = {
	campaigns: '#CB5301',
	automations: '#262666',
	contacts: '#0D9DFC',
	email_tracking: '#008230',
	forms: '#896900',
	integrations: '#3A3A99',
	pipeline: '#FFD242',
	tasks: '#0D9DFC',
	projects: '#3A3A99',
	sales: '#008230',
	support: '#896900',
	
};

const CATEGORY_ICON_ELEMENTS: Record<string, React.ReactNode> = {
	contacts: <ContactsIcon width={18} height={18} />,
	pipeline: <PiplelinesIcon width={18} height={18} />,
	// CampaignsIcon paints with its own brand blue rather than currentColor,
	// so its colour has to be passed through explicitly.
	campaigns: (
		<CampaignsIcon
			width={18}
			height={18}
			color={CATEGORY_COLORS.campaigns}
		/>
	),
	automations: <AutomationsIcon width={18} height={18} />,
	tasks: <TasksIcon width={18} height={18} />,
	email_tracking: <ProcessingEmailsIcon width={18} height={18} />,
	system: <SystemIcon width={18} height={18} />,
	booking: <UpcomingCalendarIcon width={18} height={18} />,
	support: <SupportIcon width={18} height={18} />,
	sales: <SalesIcon width={18} height={18} />,
	projects: <ProjectsIcon width={18} height={18} />,
	forms: <FormsIcon width={18} height={18} />,
	integrations: <IntegrationsIcon width={18} height={18} />,
};

// The icons paint with currentColor, so the accent is applied by a wrapper
// once here instead of being threaded through every render site.
const CATEGORY_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
	Object.entries(CATEGORY_ICON_ELEMENTS).map(([key, icon]) => [
		key,
		<span className="inline-flex" style={{ color: CATEGORY_COLORS[key] }}>
			{icon}
		</span>,
	])
);

interface PushConfig {
	enabled: boolean;
	configured: boolean;
	credentials_available: boolean;
	project_id: string;
}

/**
 * Which delivery channels are available on this install. Derived from the
 * preferences payload's channel keys: free ships email only, Pro unlocks the
 * rest via the `doublescale_notification_allowed_channels` server filter.
 */
interface ChannelsAllowed {
	bell: boolean;
	email: boolean;
	browser: boolean;
	push: boolean;
}

// ──────────────────────────────────────────────────────
// Shared Save Button
// ──────────────────────────────────────────────────────
function SaveButton({
	hasChanges,
	isSaving,
	onSave,
}: {
	hasChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
}) {
	if (!hasChanges) return null;
	return (
		<Button onClick={onSave} disabled={isSaving}>
			{isSaving ? (
				<Loader2 className="w-4 h-4 mr-2 animate-spin" />
			) : null }
			{__('Save Changes', 'doublescale')}
		</Button>
	);
}

// ──────────────────────────────────────────────────────
// Pro upsell for the locked Bell + Desktop channels (free only)
// ──────────────────────────────────────────────────────
function ProChannelsUpsell() {
	const { handleUpgradeClick, getUpgradeButtonText } = useProUpgrade();
	return (
		<Card className="border-dashed">
			<CardContent className="flex items-start justify-between gap-4 py-5">
				<div className="flex items-start gap-3">
					<div className="p-2 bg-amber-50 rounded-lg">
						<NotificationIcon
							width={20}
							height={20}
							color="#d97706"
						/>
					</div>
					<div>
						<div className="font-medium flex items-center gap-2">
							{__('Bell & desktop notifications', 'doublescale')}
							<Badge
								variant="secondary"
								className="text-xs px-1.5 py-0"
							>
								{__('Pro', 'doublescale')}
							</Badge>
						</div>
						<div className="text-sm text-muted-foreground">
							{__(
								'Get in-app bell alerts and desktop notifications with DoubleScale Pro. Email notifications are included free.',
								'doublescale'
							)}
						</div>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => handleUpgradeClick()}
					className="shrink-0"
				>
					{getUpgradeButtonText()}
				</Button>
			</CardContent>
		</Card>
	);
}

// ──────────────────────────────────────────────────────
// Desktop channel column header (Bell / Email / Browser icons)
//
// Uses a fixed-width flex group (not a dynamically-built grid template) so the
// icons line up as real column headers over the per-row switches below. Each
// channel slot is 56px wide to match the switch slots in `ChannelSwitchRow`.
// ──────────────────────────────────────────────────────
function ChannelHeaderIcons({
	showBell,
	showEmail = true,
	hasBrowser,
}: {
	showBell: boolean;
	showEmail?: boolean;
	hasBrowser: boolean;
}) {
	return (
		<div className="flex items-center shrink-0">
			{showBell && (
				<div className="w-16 flex flex-col items-center gap-1">
					<IconInApp size={32} />
					<span className="text-sm leading-none font-medium text-foreground">
						{__('In-app', 'doublescale')}
					</span>
				</div>
			)}
			{showEmail && (
				<div className="w-16 flex flex-col items-center gap-1 text-blue-500">
					<ContactTotalEmailsIcon width={32} height={32} />
					<span className="text-sm leading-none font-medium text-foreground">
						{__('Email', 'doublescale')}
					</span>
				</div>
			)}
			{hasBrowser && (
				<div className="w-16 flex flex-col items-center gap-1 text-[#CB5301]">
					<IconBrowser size={32} />
					<span className="text-sm leading-none font-medium text-foreground">
						{__('Browser', 'doublescale')}
					</span>
				</div>
			)}
		</div>
	);
}

// ──────────────────────────────────────────────────────
// One row of per-channel switches (Bell / Email / Browser) for a subcategory.
// Mirrors the fixed 56px slots in `ChannelHeaderIcons` so columns stay aligned.
// ──────────────────────────────────────────────────────
function ChannelSwitchRow({
	subPrefs,
	subKey,
	updateSubcategory,
	preferences,
	showBell,
	showEmail = true,
	hasBrowser,
	browserPermission,
}: {
	subPrefs: { bell: boolean; email: boolean; browser?: boolean };
	subKey: string;
	updateSubcategory: ReturnType<
		typeof useNotificationPreferences
	>['updateSubcategory'];
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	showBell: boolean;
	showEmail?: boolean;
	hasBrowser: boolean;
	browserPermission: NotificationPermission;
}) {
	return (
		<div className="flex items-center shrink-0">
			{showBell && (
				<div className="w-16 flex justify-center">
					<Switch
						checked={subPrefs.bell}
						onCheckedChange={(c) =>
							updateSubcategory(subKey, 'bell', c)
						}
						disabled={!preferences.channels.bell}
					/>
				</div>
			)}
			{showEmail && (
				<div className="w-16 flex justify-center">
					<Switch
						checked={subPrefs.email}
						onCheckedChange={(c) =>
							updateSubcategory(subKey, 'email', c)
						}
						disabled={!preferences.channels.email}
					/>
				</div>
			)}
			{hasBrowser && (
				<div className="w-16 flex justify-center">
					<Switch
						checked={subPrefs.browser ?? true}
						onCheckedChange={(c) =>
							updateSubcategory(subKey, 'browser', c)
						}
						disabled={
							!preferences.channels.browser ||
							browserPermission !== 'granted'
						}
					/>
				</div>
			)}
		</div>
	);
}

// ──────────────────────────────────────────────────────
// Settings section shell — grey panel with a circled icon, title,
// description and an optional right-aligned action. Mirrors the sales
// settings sections (see sales/settings/taxes-manager.tsx).
// ──────────────────────────────────────────────────────
function SettingsSection({
	icon,
	title,
	description,
	action,
	children,
	className,
}: {
	icon: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={`space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6 ${className ?? ''}`}
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex p-1.5 shrink-0 items-center justify-center rounded-full bg-white border border-border text-[#0D9DFC]">
							{icon}
						</div>
						<h2 className="lg:text-xl text-base font-semibold text-foreground">
							{title}
						</h2>
					</div>
					{description ? (
						<p className="pl-[46px] lg:text-base text-sm text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}

// ──────────────────────────────────────────────────────
// Channel toggle card (In-app / Email / Browser)
// ──────────────────────────────────────────────────────
function ChannelToggleCard({
	icon,
	title,
	description,
	badge,
	checked,
	onCheckedChange,
	disabled,
	className,
}: {
	icon: React.ReactNode;
	title: React.ReactNode;
	description: React.ReactNode;
	badge?: React.ReactNode;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<div
			className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 ${className ?? ''}`}
		>
			<div className="flex items-start gap-3 min-w-0">
				<span className="shrink-0 inline-flex">{icon}</span>
				<div className="min-w-0">
					<div className="flex items-center gap-2 flex-wrap text-sm font-semibold text-foreground">
						{title}
						{badge}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						{description}
					</p>
				</div>
			</div>
			<Switch
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
				className="shrink-0"
			/>
		</div>
	);
}

// ──────────────────────────────────────────────────────
// "Email & Desktop" sub-tab content
// ──────────────────────────────────────────────────────
function EmailDesktopTab({
	preferences,
	categories,
	subcategories,
	updateChannel,
	updateSubcategory,
	hasChanges,
	isSaving,
	onSave,
	canManageRetentionSettings,
	channelsAllowed,
	browserPermission,
	isRequestingPermission,
	testNotificationShown,
	onRequestPermission,
	onTestNotification,
	initialCategory,
	canEditSalesTemplates,
	headerAction,
}: {
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	categories: ReturnType<typeof useNotificationPreferences>['categories'];
	subcategories: ReturnType<
		typeof useNotificationPreferences
	>['subcategories'];
	updateChannel: ReturnType<
		typeof useNotificationPreferences
	>['updateChannel'];
	updateSubcategory: ReturnType<
		typeof useNotificationPreferences
	>['updateSubcategory'];
	hasChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
	canManageRetentionSettings: boolean;
	channelsAllowed: ChannelsAllowed;
	browserPermission: NotificationPermission;
	isRequestingPermission: boolean;
	testNotificationShown: boolean;
	onRequestPermission: () => void;
	onTestNotification: () => void;
	initialCategory?: string;
	canEditSalesTemplates: boolean;
	headerAction?: React.ReactNode;
}) {
	const [editingSalesTemplate, setEditingSalesTemplate] = useState<{
		subKey: string;
		label: string;
	} | null>(null);
	// Bell/browser are Pro channels: only present when Pro unlocked them
	// server-side (reflected in the preferences payload's channel keys). Browser
	// additionally requires the runtime Notification API.
	const showBell = channelsAllowed.bell;
	const showBrowser =
		channelsAllowed.browser && isBrowserNotificationSupported();
	const hasBrowser = showBrowser;

	const categoryKeys = useMemo(
		() =>
			Object.keys(categories).filter(
				(key) => Object.keys(subcategories[key] || {}).length > 0
			),
		[categories, subcategories]
	);

	const [openCategories, setOpenCategories] = useState<string[]>([]);
	useEffect(() => {
		setOpenCategories((current) => {
			const stillValid = current.filter((key) =>
				categoryKeys.includes(key)
			);
			if (stillValid.length > 0) return stillValid;
			if (initialCategory && categoryKeys.includes(initialCategory)) {
				return [initialCategory];
			}
			return categoryKeys.slice(0, 2);
		});
	}, [categoryKeys, initialCategory]);

	// Retention has no save button of its own, so this tab's single
	// "Save Changes" button persists it alongside the preferences.
	const retentionRef = useRef<NotificationRetentionHandle>(null);
	const [retentionHasChanges, setRetentionHasChanges] = useState(false);

	const handleSaveAll = async () => {
		if (retentionHasChanges) {
			await retentionRef.current?.save();
		}
		if (hasChanges) {
			onSave();
		}
	};

	return (
		<div className="space-y-6">
			{/* Global channel switches */}
			<SettingsSection
				icon={<NotificationIcon width={20} height={20} />}
				title={__('Notification Preferences', 'doublescale')}
				description={__(
					'Choose how and when you want to receive notifications.',
					'doublescale'
				)}
				action={headerAction}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{showBell && (
							<ChannelToggleCard
								icon={<IconInApp size={24} />}
								title={__('In-app (Bell)', 'doublescale')}
								description={__(
									'Show notifications in the bell icon dropdown.',
									'doublescale'
								)}
								checked={preferences.channels.bell}
								onCheckedChange={(checked) =>
									updateChannel('bell', checked)
								}
							/>
						)}

						<ChannelToggleCard
							icon={
								<ContactTotalEmailsIcon
									width={24}
									height={24}
									color="#0D9DFC"
								/>
							}
							title={__('Email', 'doublescale')}
							description={__(
								'Receive notifications via email (max 1,000/day site-wide).',
								'doublescale'
							)}
							checked={preferences.channels.email}
							onCheckedChange={(checked) =>
								updateChannel('email', checked)
							}
						/>
					</div>

					{hasBrowser && (
						<div className="rounded-xl border border-border bg-white">
							{/* Channel row */}
							<div className="flex items-start justify-between gap-3 p-4">
								<div className="flex min-w-0 items-start gap-3">
									<span className="shrink-0 inline-flex text-[#CB5301]">
										<IconBrowser size={24} />
									</span>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
											{__(
												'Browser Notifications',
												'doublescale'
											)}
											{browserPermission === 'granted' ? (
												<Badge className="border-0 bg-[#E4FAEC] px-2 py-1 text-sm leading-4 text-[#008230] shadow-none">
													{__(
														'Permission granted',
														'doublescale'
													)}
												</Badge>
											) : browserPermission ===
											  'denied' ? (
												<Badge className="border-0 bg-[#FBE8E8] px-2 py-1 text-sm leading-4 text-[#C30A0A] shadow-none">
													{__(
														'Blocked',
														'doublescale'
													)}
												</Badge>
											) : (
												<Badge className="border-0 bg-[#EEEEEF] shadow-none px-2 py-1 text-sm leading-4 text-primary">
													{__(
														'Permission needed',
														'doublescale'
													)}
												</Badge>
											)}
										</div>
										<p className="text-xs text-muted-foreground mt-2">
											{__(
												'Desktop notifications are enabled to show desktop notifications when DoubleScale tab is not focused.',
												'doublescale'
											)}
										</p>
									</div>
								</div>
								<Switch
									checked={preferences.channels.browser}
									onCheckedChange={(checked) =>
										updateChannel('browser', checked)
									}
									disabled={browserPermission !== 'granted'}
									className="shrink-0"
								/>
							</div>

							{/* Test notification row */}
							<div className="flex flex-col gap-3 border-t border-border mx-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-muted-foreground">
									{__(
										'Send a test notification to verify everything is working.',
										'doublescale'
									)}
								</p>
								<Button
									type="button"
									variant="secondaryDeepBlue"
									size="sm"
									className="shrink-0 gap-1 bg-white h-8"
									onClick={
										browserPermission === 'granted'
											? onTestNotification
											: onRequestPermission
									}
									disabled={
										browserPermission === 'granted'
											? testNotificationShown
											: isRequestingPermission
									}
								>
									{browserPermission === 'granted' ? (
										testNotificationShown ? (
											<>
												{__('Sent!', 'doublescale')}
											</>
										) : (
											<>
												{__('Test', 'doublescale')}
												<ArrowRight className="h-3.5 w-3.5" />
											</>
										)
									) : isRequestingPermission ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											{__('Requesting...', 'doublescale')}
										</>
									) : (
										<>
											{__('Test', 'doublescale')}
											<ArrowRight className="h-3.5 w-3.5" />
										</>
									)}
								</Button>
							</div>

							{/* Permission notice */}
							{browserPermission !== 'granted' && (
								<div className="px-4 pb-4">
									<div className="flex items-start justify-between gap-3 rounded-lg bg-[#FFF4ED] p-4">
										<div className="flex min-w-0 items-center gap-2">
											<span className="mt-0.5 shrink-0 inline-flex">
												<InfoIcon
													width={24}
													height={24}
													color="#CB5301"
												/>
											</span>
											<p className="text-sm text-[#CB5301]">
												{browserPermission === 'denied'
													? __(
															"Browser notifications are blocked. To enable, click your browser's site settings icon in the address bar and allow notifications.",
															'doublescale'
														)
													: __(
															'Allow DoubleScale to show notifications through your operating system notification center.',
															'doublescale'
														)}
											</p>
										</div>
										{browserPermission === 'default' && (
											<Button
												onClick={onRequestPermission}
												disabled={
													isRequestingPermission
												}
												size="sm"
												variant="secondaryDeepBlue"
												className="shrink-0 gap-1 bg-white"
											>
												{isRequestingPermission
													? __(
															'Requesting...',
															'doublescale'
														)
													: __(
															'Turn On',
															'doublescale'
														)}
											</Button>
										)}
									</div>
								</div>
							)}

							{/* How it works */}
							{browserPermission === 'granted' && (
								<div className="px-4 pb-4">
									<div className="flex gap-3 rounded-lg bg-[#EAF4FD] p-4">
										<span className="mt-0.5 shrink-0 inline-flex">
											<InfoIcon
												width={24}
												height={24}
												color="#0D9DFC"
											/>
										</span>
										<div className="text-sm text-[#0D9DFC]">
											<p className="mb-1">
												{__(
													'How browser notifications work:',
													'doublescale'
												)}
											</p>
											<ul className="list-inside list-disc space-y-1 ps-2">
												<li>
													{__(
														'Notifications appear when DoubleScale tab is open but not focused',
														'doublescale'
													)}
												</li>
												<li>
													{__(
														'Click a notification to return to DoubleScale and see details',
														'doublescale'
													)}
												</li>
												<li>
													{__(
														'Notifications auto-dismiss after ~5 seconds',
														'doublescale'
													)}
												</li>
												<li>
													{__(
														'You can disable this anytime in your browser settings',
														'doublescale'
													)}
												</li>
											</ul>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{!showBell && !channelsAllowed.browser && (
						<ProChannelsUpsell />
					)}
				</div>
			</SettingsSection>

			{/* Per-category toggles — accordion groups with Bell / Email / Browser switches. */}
			<SettingsSection
				icon={<IconDatabase size={20} />}
				title={__('What you get notified about', 'doublescale')}
				description={__(
					'Pick a category, then choose which notifications you want on each channel.',
					'doublescale'
				)}
			>
				{categoryKeys.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{__(
							'No notification categories are available yet.',
							'doublescale'
						)}
					</p>
				) : (
					<Accordion
						type="multiple"
						value={openCategories}
						onValueChange={setOpenCategories}
						className="space-y-4"
					>
						{categoryKeys.map((key) => {
							const category = categories[key];
							const catSubs = subcategories[key] || {};
							const subEntries = Object.entries(catSubs);

							return (
								<AccordionItem
									key={key}
									value={key}
									className="rounded-xl border border-border bg-white px-6"
								>
									<AccordionTrigger className="py-6 hover:no-underline">
										<div className="flex min-w-0 flex-1 items-start gap-3 pe-6 text-start">
											<span className="mt-0.5 shrink-0 inline-flex">
												{CATEGORY_ICONS[key] ?? null}
											</span>
											<div className="min-w-0">
												<div className="text-sm font-semibold text-foreground">
													{category.label}
												</div>
												<p className="text-xs font-normal text-muted-foreground">
													{category.description}
												</p>
											</div>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pb-6">
										<div className="flex items-center justify-end border-y py-6">
											<ChannelHeaderIcons
												showBell={showBell}
												showEmail={key !== 'booking'}
												hasBrowser={hasBrowser}
											/>
										</div>
										<div className="divide-y">
											{subEntries.map(
												([subKey, subInfo]) => {
													const subPrefs =
														preferences
															.subcategories[
															subKey
														];
													if (!subPrefs) return null;
													return (
														<div
															key={subKey}
															className="flex items-center justify-between gap-4 py-6"
														>
															<div className="flex min-w-0 items-start gap-3">
																<span className="mt-0.5 shrink-0 inline-flex">
																	{CATEGORY_ICONS[
																		key
																	] ?? null}
																</span>
																<div className="min-w-0">
																	<div className="text-sm font-medium text-foreground">
																		{
																			subInfo.label
																		}
																	</div>
																	<p className="text-xs text-muted-foreground">
																		{
																			subInfo.description
																		}
																	</p>
																</div>
															</div>
															<div className="flex shrink-0 items-center gap-2">
																{canEditSalesTemplates &&
																key ===
																	'sales' ? (
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		className="h-8 bg-white text-[#0D9DFC] border-[#0D9DFC]"
																		onClick={() =>
																			setEditingSalesTemplate(
																				{
																					subKey,
																					label: subInfo.label,
																				}
																			)
																		}
																	>
																		<EditHeaderIcon width={24} height={24} color="#0D9DFC"/>
																		{__(
																			'Edit',
																			'doublescale'
																		)}
																	</Button>
																) : null}
																<ChannelSwitchRow
																	subPrefs={
																		subPrefs
																	}
																	subKey={
																		subKey
																	}
																	updateSubcategory={
																		updateSubcategory
																	}
																	preferences={
																		preferences
																	}
																	showBell={
																		showBell
																	}
																	showEmail={
																		key !==
																		'booking'
																	}
																	hasBrowser={
																		hasBrowser
																	}
																	browserPermission={
																		browserPermission
																	}
																/>
															</div>
														</div>
													);
												}
											)}
										</div>
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				)}

				<p className="text-xs text-muted-foreground">
					{__(
						'Note: Disabling a global channel will disable all category toggles for that channel.',
						'doublescale'
					)}
				</p>
			</SettingsSection>

			{canManageRetentionSettings && (
				<NotificationRetentionSettings
					ref={retentionRef}
					onDirtyChange={setRetentionHasChanges}
				/>
			)}

			<SalesNotificationTemplateDialog
				open={editingSalesTemplate !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditingSalesTemplate(null);
					}
				}}
				subKey={editingSalesTemplate?.subKey ?? null}
				label={editingSalesTemplate?.label ?? ''}
			/>

			<div className="flex justify-end">
				<SaveButton
					hasChanges={hasChanges || retentionHasChanges}
					isSaving={isSaving}
					onSave={handleSaveAll}
				/>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────
// "Mobile app" sub-tab content
// ──────────────────────────────────────────────────────
function MobileAppTab({
	preferences,
	categories,
	subcategories,
	updateChannel,
	updateSubcategory,
	hasChanges,
	isSaving,
	onSave,
	canManagePushSetup,
	whiteLabel,
	pushConfig,
	pushConfigLoading,
	pushToggling,
	pushTesting,
	pushMessage,
	pushCategories,
	pushExcludedSubcategories,
	onPushToggle,
	onPushTest,
	pushSending,
	pushSendMessage,
	onPushSend,
	headerAction,
}: {
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	categories: ReturnType<typeof useNotificationPreferences>['categories'];
	subcategories: ReturnType<
		typeof useNotificationPreferences
	>['subcategories'];
	updateChannel: ReturnType<
		typeof useNotificationPreferences
	>['updateChannel'];
	updateSubcategory: ReturnType<
		typeof useNotificationPreferences
	>['updateSubcategory'];
	hasChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
	canManagePushSetup: boolean;
	whiteLabel: ReturnType<typeof ConfigAPI.getWhiteLabel>;
	pushConfig: PushConfig | null;
	pushConfigLoading: boolean;
	pushToggling: boolean;
	pushTesting: boolean;
	pushMessage: { type: 'success' | 'error'; text: string } | null;
	pushCategories: string[];
	pushExcludedSubcategories: string[];
	onPushToggle: (checked: boolean) => void;
	onPushTest: () => void;
	pushSending: boolean;
	pushSendMessage: { type: 'success' | 'error'; text: string } | null;
	onPushSend: () => void;
	headerAction?: React.ReactNode;
}) {
	const pushSiteWideEnabled = pushConfig?.enabled ?? false;
	const [openCategories, setOpenCategories] = useState<string[]>([]);

	return (
		<div className="space-y-6">
			<SettingsSection
				icon={<NotificationIcon width={20} height={20} />}
				title={__('Notification Preferences', 'doublescale')}
				description={__(
					'Choose how and when you want to receive notifications.',
					'doublescale'
				)}
				action={headerAction}
			>
				<div className="space-y-4">
					{/* 1. Mobile Push Setup — admin only, first element */}
					{canManagePushSetup && !whiteLabel?.enabled && (
						<div className="space-y-4 rounded-xl border border-border bg-white p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex min-w-0 items-start gap-3">
									<span className="shrink-0 inline-flex text-[#0D9DFC]">
										<IconMobile size={24} />
									</span>
									<div className="min-w-0 space-y-0.5">
										<Label
											htmlFor="push-site-toggle"
											className="text-sm font-semibold text-foreground"
										>
											{__(
												'Mobile Push Setup',
												'doublescale'
											)}
										</Label>
										<p className="text-xs mt-2 text-muted-foreground">
											{__(
												'When enabled, CRM events will trigger push notifications to mobile devices to configure push notifications for the DoubleScale mobile app.',
												'doublescale'
											)}
										</p>
									</div>
								</div>
								<Switch
									id="push-site-toggle"
									checked={pushSiteWideEnabled}
									onCheckedChange={onPushToggle}
									disabled={pushToggling || pushConfigLoading}
									className="shrink-0"
								/>
							</div>

							{pushSiteWideEnabled && pushConfig && (
								<div
									className={`flex items-center gap-2 rounded-lg p-4 ${
										pushConfig.configured
											? 'bg-[#E4FAEC]'
											: pushConfig.credentials_available
												? 'bg-[#F7F4C3]'
												: 'bg-[#FBE8E8]'
									}`}
								>
									{pushConfig.configured ? (
										<>
											<CheckCheck className="w-6 h-6 text-[#008230] flex-shrink-0" />
											<span className="text-sm font-medium text-[#008230]">
												{__(
													'Active — Push notifications are ready to be sent to mobile devices.',
													'doublescale'
												)}
											</span>
										</>
									) : pushConfig.credentials_available ? (
										<>
											<Loader2 className="w-6 h-6 animate-spin text-[#896900] flex-shrink-0" />
											<span className="text-sm font-medium text-[#896900]">
												{__(
													'Initializing — push notification credentials are being set up.',
													'doublescale'
												)}
											</span>
										</>
									) : (
										<>
											<X className="w-6 h-6 text-[#C30A0A] flex-shrink-0" />
											<span className="text-sm font-medium text-[#C30A0A]">
												{__(
													'Push notification credentials are not yet available. Please update the plugin to the latest version.',
													'doublescale'
												)}
											</span>
										</>
									)}
								</div>
							)}

							{pushSiteWideEnabled && pushConfig?.configured && (
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[#F7F8FA] p-4">
										<p className="text-sm text-muted-foreground">
											{__(
												'Verify that your site can communicate with the push notification service.',
												'doublescale'
											)}
										</p>
										<Button
											onClick={onPushTest}
											disabled={pushTesting}
											variant="secondaryDeepBlue"
											size="sm"
											className="shrink-0 gap-1.5 bg-white h-8"
										>
											{pushTesting ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
													{__(
														'Testing...',
														'doublescale'
													)}
												</>
											) : (
												<>
													{__(
														'Test Connection',
														'doublescale'
													)}
													<ArrowRight className="h-3.5 w-3.5" />
												</>
											)}
										</Button>
									</div>

									<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[#F7F8FA] p-4">
										<p className="text-sm text-muted-foreground">
											{__(
												'Send a test notification to your mobile device to verify delivery.',
												'doublescale'
											)}
										</p>
										<Button
											onClick={onPushSend}
											disabled={pushSending}
											variant="secondaryDeepBlue"
											size="sm"
											className="shrink-0 gap-1.5 bg-white h-8"
										>
											{pushSending ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
													{__(
														'Sending...',
														'doublescale'
													)}
												</>
											) : (
												<>
													{__(
														'Send Test Push',
														'doublescale'
													)}
													<ArrowRight className="h-3.5 w-3.5" />
												</>
											)}
										</Button>
									</div>
								</div>
							)}

							{pushMessage && (
								<div
									className={`flex items-center gap-2 rounded-lg p-4 ${
										pushMessage.type === 'success'
											? 'bg-[#E4FAEC] text-[#008230]'
											: 'bg-[#FBE8E8] text-[#C30A0A]'
									}`}
								>
									{pushMessage.type === 'success' ? (
										<CheckCheck className="w-6 h-6 flex-shrink-0 text-[#008230]" />
									) : (
										<X className="w-6 h-6 flex-shrink-0 text-[#C30A0A]" />
									)}
									<span className="text-sm">
										{pushMessage.text}
									</span>
								</div>
							)}

							{pushSendMessage && (
								<div
									className={`flex items-center gap-2 rounded-lg p-4 ${
										pushSendMessage.type === 'success'
											? 'bg-[#E4FAEC] text-[#008230]'
											: 'bg-[#FBE8E8] text-[#C30A0A]'
									}`}
								>
									{pushSendMessage.type === 'success' ? (
										<CheckCheck className="w-6 h-6 flex-shrink-0 text-[#008230]" />
									) : (
										<X className="w-6 h-6 flex-shrink-0 text-[#C30A0A]" />
									)}
									<span className="text-sm">
										{pushSendMessage.text}
									</span>
								</div>
							)}
						</div>
					)}

					{/* 2b. Test Push — visible to all users when push is enabled */}
					{!pushConfigLoading &&
						pushSiteWideEnabled &&
						!canManagePushSetup && (
							<div className="space-y-4 rounded-xl border border-border bg-white p-4">
								<div className="flex items-center justify-between gap-3">
									<p className="text-xs text-muted-foreground">
										{__(
											'Send a test notification to your mobile device to verify delivery.',
											'doublescale'
										)}
									</p>
									<Button
										onClick={onPushSend}
										disabled={pushSending}
										variant="outline"
										size="sm"
										className="shrink-0 gap-1.5 bg-white"
									>
										{pushSending ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												{__(
													'Sending...',
													'doublescale'
												)}
											</>
										) : (
											<>
												{__(
													'Send Test Push',
													'doublescale'
												)}
												<ArrowRight className="h-3.5 w-3.5" />
											</>
										)}
									</Button>
								</div>
								{pushSendMessage && (
									<div
										className={`flex items-center gap-2 rounded-lg p-4 ${
											pushSendMessage.type === 'success'
												? 'bg-[#E4FAEC] text-[#008230]'
												: 'bg-[#FBE8E8] text-[#C30A0A]'
										}`}
									>
										{pushSendMessage.type === 'success' ? (
											<CheckCheck className="w-6 h-6 flex-shrink-0 text-[#008230]" />
										) : (
											<X className="w-6 h-6 flex-shrink-0 text-[#C30A0A]" />
										)}
										<span className="text-sm">
											{pushSendMessage.text}
										</span>
									</div>
								)}
							</div>
						)}

					{/* 2. Info Note */}
					<div className="flex items-center gap-3 rounded-xl bg-[#EAF4FD] p-4">
						<span className="inline-flex shrink-0 text-[#0D9DFC]">
							<IconMobile size={24} />
						</span>
						<p className="text-sm text-[#0D9DFC]">
							{__(
								'Push and in-app notifications will be sent to your mobile device if you have the DoubleScale app installed. You can also change your mobile notification settings in the DoubleScale mobile app.',
								'doublescale'
							)}
						</p>
					</div>

					{/* 3. Site-wide disabled warning */}
					{!pushConfigLoading && !pushSiteWideEnabled && (
						<div className="flex items-center gap-3 rounded-xl bg-[#F7F4C3] p-4">
							<span className="inline-flex shrink-0">
								<InfoIcon
									width={24}
									height={24}
									color="#896900"
								/>
							</span>
							<p className="text-sm text-[#896900]">
								{canManagePushSetup
									? __(
											'Push notifications are currently disabled. Enable them above to configure per-category settings.',
											'doublescale'
										)
									: __(
											'Push notifications are not enabled by your administrator. Contact your admin to enable mobile push notifications.',
											'doublescale'
										)}
							</p>
						</div>
					)}
				</div>
			</SettingsSection>

			{/* 4. Per-category push toggles — mobile-relevant only */}
			<SettingsSection
				icon={
					<MobileNotificationsIcon
						width={20}
						height={20}
						color="#008230"
					/>
				}
				title={__('Mobile Push', 'doublescale')}
				description={
					<>
						{__(
							'Receive push notifications on your mobile device.',
							'doublescale'
						)}
						{!pushSiteWideEnabled && !pushConfigLoading && (
							<span className="ms-1 font-semibold text-[#CB5301]">
								{__(
									'Push notifications are not enabled by your administrator.',
									'doublescale'
								)}
							</span>
						)}
					</>
				}
				action={
					<Switch
						checked={
							pushSiteWideEnabled && preferences.channels.push
						}
						onCheckedChange={(checked) =>
							updateChannel('push', checked)
						}
						disabled={!pushSiteWideEnabled}
						className="shrink-0"
					/>
				}
			>
				<div className="space-y-4">
					{Object.entries(categories)
						.filter(([key]) => pushCategories.includes(key))
						.map(([key, category]) => {
							const catSubs = subcategories[key] || {};
							const subEntries = Object.entries(catSubs).filter(
								([subKey]) =>
									!pushExcludedSubcategories.includes(subKey)
							);
							if (subEntries.length === 0) return null;

							const pushDisabled =
								!pushSiteWideEnabled ||
								!preferences.channels.push;

							if (subEntries.length === 1) {
								const [subKey] = subEntries[0];
								const subPrefs =
									preferences.subcategories[subKey];
								if (!subPrefs) return null;
								return (
									<div
										key={key}
										className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-4"
									>
										<div className="flex min-w-0 items-start gap-3">
											<span className="mt-0.5 shrink-0 inline-flex">
												{CATEGORY_ICONS[key] ?? null}
											</span>
											<div className="min-w-0">
												<div className="text-sm font-semibold text-foreground">
													{category.label}
												</div>
												<p className="text-xs text-muted-foreground">
													{category.description}
												</p>
											</div>
										</div>
										<Switch
											checked={
												pushSiteWideEnabled &&
												preferences.channels.push &&
												(subPrefs.push ?? true)
											}
											onCheckedChange={(c) =>
												updateSubcategory(
													subKey,
													'push',
													c
												)
											}
											disabled={pushDisabled}
											className="shrink-0"
										/>
									</div>
								);
							}

							return (
								<Accordion
									key={key}
									type="multiple"
									value={openCategories}
									onValueChange={setOpenCategories}
									className="rounded-xl border border-border bg-white px-4"
								>
									<AccordionItem
										value={key}
										className="border-b-0"
									>
										<AccordionTrigger className="py-4 hover:no-underline">
											<div className="flex min-w-0 flex-1 items-start gap-3 pe-3 text-start">
												<span className="mt-0.5 shrink-0 inline-flex">
													{CATEGORY_ICONS[key] ??
														null}
												</span>
												<div className="min-w-0">
													<div className="text-sm font-semibold text-foreground">
														{category.label}
													</div>
													<p className="text-xs font-normal text-muted-foreground">
														{category.description}
													</p>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="pb-2">
											<div className="divide-y border-t">
												{subEntries.map(
													([subKey, subInfo]) => {
														const subPrefs =
															preferences
																.subcategories[
																subKey
															];
														if (!subPrefs)
															return null;
														return (
															<div
																key={subKey}
																className="flex items-center justify-between gap-4 py-3"
															>
																<div className="flex min-w-0 items-start gap-3">
																	<span className="mt-0.5 shrink-0 inline-flex">
																		{CATEGORY_ICONS[
																			key
																		] ??
																			null}
																	</span>
																	<div className="min-w-0">
																		<div className="text-sm font-medium text-foreground">
																			{
																				subInfo.label
																			}
																		</div>
																		<p className="text-xs text-muted-foreground">
																			{
																				subInfo.description
																			}
																		</p>
																	</div>
																</div>
																<div className="flex shrink-0 items-center gap-2">
																	<span className="text-xs text-muted-foreground">
																		{__(
																			'Enable Mobile Push',
																			'doublescale'
																		)}
																	</span>
																	<Switch
																		checked={
																			pushSiteWideEnabled &&
																			preferences
																				.channels
																				.push &&
																			(subPrefs.push ??
																				true)
																		}
																		onCheckedChange={(
																			c
																		) =>
																			updateSubcategory(
																				subKey,
																				'push',
																				c
																			)
																		}
																		disabled={
																			pushDisabled
																		}
																	/>
																</div>
															</div>
														);
													}
												)}
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							);
						})}
				</div>
			</SettingsSection>

			<div className="flex justify-end">
				<SaveButton
					hasChanges={hasChanges}
					isSaving={isSaving}
					onSave={onSave}
				/>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────
export function NotificationPreferences({
	initialCategory,
}: {
	/**
	 * Category key to open on mount (deep-link target, e.g. 'support'). When the
	 * key isn't a real category on this install it's ignored and the first
	 * category is selected instead.
	 */
	initialCategory?: string;
} = {}) {
	const {
		isLoading,
		isSaving,
		error,
		preferences,
		categories,
		subcategories,
		updateChannel,
		updateSubcategory,
		savePreferences,
		hasChanges,
	} = useNotificationPreferences();

	const { hasLimitedSettingsAccess, hasRequiredCapability } =
		useCapabilities();

	// Which channels are available on this install. The preferences payload only
	// contains keys for allowed channels (free = email only; Pro unlocks the
	// rest via the `doublescale_notification_allowed_channels` server filter), so
	// the presence of a channel key is the source of truth for the UI.
	const channelsAllowed: ChannelsAllowed = useMemo(() => {
		const keys = Object.keys(preferences.channels || {});
		return {
			bell: keys.includes('bell'),
			email: keys.includes('email'),
			browser: keys.includes('browser'),
			push: keys.includes('push'),
		};
	}, [preferences.channels]);

	// PHP computes this so CRM Manager + Sales Rep multi-role users keep full
	// notification controls (not treated as sales-only).
	const hasLimitedAccess = hasLimitedSettingsAccess();
	const canManageRetentionSettings = !hasLimitedAccess;
	const canEditSalesTemplates =
		hasRequiredCapability([
			'doublescale_manage_all_sales',
			'doublescale_crm_manager',
		]) && config.isModuleToggleEnabled('sales');
	const canManagePushSetup = !hasLimitedAccess;
	const whiteLabel =
		typeof ConfigAPI.getWhiteLabel === 'function'
			? ConfigAPI.getWhiteLabel()
			: undefined;

	const [browserPermission, setBrowserPermission] =
		useState<NotificationPermission>('default');
	const [isRequestingPermission, setIsRequestingPermission] = useState(false);
	const [testNotificationShown, setTestNotificationShown] = useState(false);

	const [pushConfig, setPushConfig] = useState<PushConfig | null>(null);
	const [pushConfigLoading, setPushConfigLoading] = useState(true);
	const [pushToggling, setPushToggling] = useState(false);
	const [pushTesting, setPushTesting] = useState(false);
	const [pushMessage, setPushMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);
	const [pushSending, setPushSending] = useState(false);
	const [pushSendMessage, setPushSendMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);

	// Derive push-supported and desktop-only category lists from API metadata
	const { pushCategories, pushExcludedSubcategories } = useMemo(() => {
		const pushCats: string[] = [];
		const excludedSubs: string[] = [];

		Object.entries(categories).forEach(([key, cat]) => {
			if (cat.push_supported) {
				pushCats.push(key);
				if (cat.push_excluded_subcategories) {
					excludedSubs.push(...cat.push_excluded_subcategories);
				}
			}
		});

		return {
			pushCategories: pushCats,
			pushExcludedSubcategories: excludedSubs,
		};
	}, [categories]);

	useEffect(() => {
		const fetchPushConfig = async () => {
			try {
				const data = (await apiFetch({
					path: '/doublescale/v1/settings/mobile-app',
				})) as PushConfig;
				setPushConfig(data);
			} catch {
				setPushConfig({
					enabled: false,
					configured: false,
					credentials_available: false,
					project_id: '',
				});
			} finally {
				setPushConfigLoading(false);
			}
		};
		fetchPushConfig();
	}, []);

	const handlePushToggle = async (checked: boolean) => {
		setPushToggling(true);
		setPushMessage(null);
		try {
			const res = (await apiFetch({
				path: '/doublescale/v1/settings/mobile-app',
				method: 'POST',
				data: { enabled: checked },
			})) as { success: boolean; enabled: boolean };
			setPushConfig((prev) =>
				prev ? { ...prev, enabled: res.enabled } : prev
			);
			if (res.enabled) {
				const data = (await apiFetch({
					path: '/doublescale/v1/settings/mobile-app',
				})) as PushConfig;
				setPushConfig(data);
			}
		} catch (err: any) {
			setPushMessage({
				type: 'error',
				text:
					err?.message ||
					__('Failed to update setting.', 'doublescale'),
			});
		} finally {
			setPushToggling(false);
		}
	};

	const handlePushTest = async () => {
		setPushTesting(true);
		setPushMessage(null);
		try {
			const res = (await apiFetch({
				path: '/doublescale/v1/settings/mobile-app/test',
				method: 'POST',
			})) as { success: boolean; message: string };
			setPushMessage({
				type: res.success ? 'success' : 'error',
				text: res.message,
			});
		} catch (err: any) {
			setPushMessage({
				type: 'error',
				text:
					err?.message ||
					__('Connection test failed.', 'doublescale'),
			});
		} finally {
			setPushTesting(false);
		}
	};

	const handlePushSend = async () => {
		setPushSending(true);
		setPushSendMessage(null);
		try {
			const res = (await apiFetch({
				path: '/doublescale/v1/settings/mobile-app/test-push',
				method: 'POST',
			})) as { success: boolean; message: string };
			setPushSendMessage({
				type: res.success ? 'success' : 'error',
				text: res.message,
			});
		} catch (err: any) {
			setPushSendMessage({
				type: 'error',
				text:
					err?.message ||
					__('Failed to send test push.', 'doublescale'),
			});
		} finally {
			setPushSending(false);
		}
	};

	useEffect(() => {
		const checkPermission = () => {
			if (isBrowserNotificationSupported()) {
				setBrowserPermission(getBrowserNotificationPermission());
			}
		};
		checkPermission();
		window.addEventListener('focus', checkPermission);
		return () => window.removeEventListener('focus', checkPermission);
	}, []);

	const handleRequestPermission = async () => {
		setIsRequestingPermission(true);
		try {
			const permission = await requestBrowserNotificationPermission();
			setBrowserPermission(permission);
			if (permission === 'granted') {
				setTestNotificationShown(true);
				showTestBrowserNotification();
				setTimeout(() => setTestNotificationShown(false), 3000);
			}
		} catch (err) {
			console.error('Failed to request permission:', err);
		} finally {
			setIsRequestingPermission(false);
		}
	};

	const handleTestNotification = () => {
		const result = showTestBrowserNotification();
		if (result) {
			setTestNotificationShown(true);
			setTimeout(() => setTestNotificationShown(false), 3000);
		} else {
			const currentPermission = getBrowserNotificationPermission();
			setBrowserPermission(currentPermission);
		}
	};

	const [activeChannelTab, setActiveChannelTab] = useState('email-desktop');

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
		);
	}

	const handleSave = async () => {
		try {
			await savePreferences();
		} catch {
			// Error handled in hook
		}
	};

	// Channel sub-tab pills. Rendered inside the "Notification Preferences"
	// section header so the switcher sits next to the title, and only when the
	// Mobile (push) channel is available on this install.
	const channelTabs = channelsAllowed.push ? (
		<div className="flex shrink-0 items-center gap-2">
			{[
				{
					value: 'email-desktop',
					label: __('Email & Desktop', 'doublescale'),
					icon: <IconBrowser size={24} />,
				},
				{
					value: 'mobile-app',
					label: __('Mobile app', 'doublescale'),
					icon: <IconMobile size={24} />,
				},
			].map((tab) => {
				const isActive = activeChannelTab === tab.value;
				return (
					<button
						key={tab.value}
						type="button"
						onClick={() => setActiveChannelTab(tab.value)}
						className={`flex items-center gap-1.5 rounded-lg border p-2 text-sm transition-colors ${
							isActive
								? 'bg-[#EEEEFF] text-primary font-medium'
								: 'border-border bg-white text-accent-foreground font-normal'
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				);
			})}
		</div>
	) : null;

	const emailDesktopContent = (
		<EmailDesktopTab
			preferences={preferences}
			categories={categories}
			subcategories={subcategories}
			updateChannel={updateChannel}
			updateSubcategory={updateSubcategory}
			hasChanges={hasChanges}
			isSaving={isSaving}
			onSave={handleSave}
			canManageRetentionSettings={canManageRetentionSettings}
			channelsAllowed={channelsAllowed}
			browserPermission={browserPermission}
			isRequestingPermission={isRequestingPermission}
			testNotificationShown={testNotificationShown}
			onRequestPermission={handleRequestPermission}
			onTestNotification={handleTestNotification}
			initialCategory={initialCategory}
			canEditSalesTemplates={canEditSalesTemplates}
			headerAction={channelTabs}
		/>
	);

	const mobileAppContent = (
		<MobileAppTab
			preferences={preferences}
			categories={categories}
			subcategories={subcategories}
			updateChannel={updateChannel}
			updateSubcategory={updateSubcategory}
			hasChanges={hasChanges}
			isSaving={isSaving}
			onSave={handleSave}
			canManagePushSetup={canManagePushSetup}
			whiteLabel={whiteLabel}
			pushConfig={pushConfig}
			pushConfigLoading={pushConfigLoading}
			pushToggling={pushToggling}
			pushTesting={pushTesting}
			pushMessage={pushMessage}
			pushCategories={pushCategories}
			pushExcludedSubcategories={pushExcludedSubcategories}
			onPushToggle={handlePushToggle}
			onPushTest={handlePushTest}
			pushSending={pushSending}
			pushSendMessage={pushSendMessage}
			onPushSend={handlePushSend}
			headerAction={channelTabs}
		/>
	);

	// The Mobile (push) tab is a Pro channel, so it only exists when push is
	// available on this install. The switcher lives in the section header of
	// each panel (see `channelTabs`), so there is no separate tab strip.
	return (
		<div className="space-y-6">
			{channelsAllowed.push && activeChannelTab === 'mobile-app'
				? mobileAppContent
				: emailDesktopContent}
		</div>
	);
}

export default NotificationPreferences;
