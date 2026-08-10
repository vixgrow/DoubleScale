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

import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useNotificationPreferences } from '@doublescale/hooks/use-notification-preferences';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import ConfigAPI from '@/config';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Save, CheckCircle2, AlertCircle, XCircle, Wifi, Pencil } from 'lucide-react';
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
	DesktopNotificationsIcon,
	MobileNotificationsIcon,
	PageTabs,
	ContactTotalEmailsIcon,
} from '@doublescale/components';
import { UpcomingCalendarIcon } from '@/components/booking';
import { SupportIcon } from '@/components/support';
import NotificationRetentionSettings from './notification-retention-settings';
import { SalesNotificationTemplateDialog } from './sales-notification-template-dialog';
import config from '@doublescale/config';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	contacts: <ContactsIcon width={18} height={18} />,
	deals: <PiplelinesIcon width={18} height={18} />,
	campaigns: <CampaignsIcon width={18} height={18} />,
	automations: <AutomationsIcon width={18} height={18} />,
	tasks: <TasksIcon width={18} height={18} />,
	system: <SystemIcon width={18} height={18} />,
	booking: <UpcomingCalendarIcon width={18} height={18} />,
	support: <SupportIcon width={18} height={18} />,
	sales: <SalesIcon width={18} height={18} />,
	projects: <ProjectsIcon width={18} height={18} />,
};

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
			) : (
				<Save className="w-4 h-4 mr-2" />
			)}
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
						<NotificationIcon width={20} height={20} color="#d97706" />
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
				<div className="w-14 flex justify-center text-muted-foreground">
					<NotificationIcon width={16} height={16} />
				</div>
			)}
			{showEmail && (
				<div className="w-14 flex justify-center text-muted-foreground">
					<ContactTotalEmailsIcon width={16} height={16} />
				</div>
			)}
			{hasBrowser && (
				<div className="w-14 flex justify-center text-muted-foreground">
					<DesktopNotificationsIcon width={16} height={16} />
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
	updateSubcategory: ReturnType<typeof useNotificationPreferences>['updateSubcategory'];
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	showBell: boolean;
	showEmail?: boolean;
	hasBrowser: boolean;
	browserPermission: NotificationPermission;
}) {
	return (
		<div className="flex items-center shrink-0">
			{showBell && (
				<div className="w-14 flex justify-center">
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
				<div className="w-14 flex justify-center">
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
				<div className="w-14 flex justify-center">
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
}: {
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	categories: ReturnType<typeof useNotificationPreferences>['categories'];
	subcategories: ReturnType<typeof useNotificationPreferences>['subcategories'];
	updateChannel: ReturnType<typeof useNotificationPreferences>['updateChannel'];
	updateSubcategory: ReturnType<typeof useNotificationPreferences>['updateSubcategory'];
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
}) {
	const [editingSalesTemplate, setEditingSalesTemplate] = useState<{
		subKey: string;
		label: string;
	} | null>(null);
	// Bell/browser are Pro channels: only present when Pro unlocked them
	// server-side (reflected in the preferences payload's channel keys). Browser
	// additionally requires the runtime Notification API.
	const showBell = channelsAllowed.bell;
	const showBrowser = channelsAllowed.browser && isBrowserNotificationSupported();
	const hasBrowser = showBrowser;

	// Only categories that actually have toggleable subcategories are shown as
	// tabs (matches the previous matrix, which skipped empty categories).
	const categoryKeys = useMemo(
		() =>
			Object.keys(categories).filter(
				(key) => Object.keys(subcategories[key] || {}).length > 0
			),
		[categories, subcategories]
	);

	// Active category subtab. Seed from the deep-link target when valid, else the
	// first category. Re-syncs if the deep-link or the category set changes.
	const [activeCategory, setActiveCategory] = useState<string>('');
	useEffect(() => {
		if (categoryKeys.length === 0) {
			setActiveCategory('');
			return;
		}
		setActiveCategory((current) => {
			if (current && categoryKeys.includes(current)) return current;
			if (initialCategory && categoryKeys.includes(initialCategory)) {
				return initialCategory;
			}
			return categoryKeys[0];
		});
	}, [categoryKeys, initialCategory]);

	return (
		<div className="space-y-6">
			{/* Channel Toggles — Bell, Email, Browser (no push) */}
			<Card>
				<CardHeader>
					<CardTitle>
						{__('Notification Channels', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__(
							'Control how you receive notifications on desktop.',
							'doublescale'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Bell (Pro channel) */}
					{showBell && (
						<div className="flex items-center justify-between">
							<div className="flex items-start gap-3">
								<div className="p-2 bg-blue-50 rounded-lg">
									<NotificationIcon width={20} height={20} color="#2563eb" />
								</div>
								<div>
									<div className="font-medium">
										{__('In-app (Bell)', 'doublescale')}
									</div>
									<div className="text-sm text-muted-foreground">
										{__(
											'Show notifications in the bell icon dropdown.',
											'doublescale'
										)}
									</div>
								</div>
							</div>
							<Switch
								checked={preferences.channels.bell}
								onCheckedChange={(checked) =>
									updateChannel('bell', checked)
								}
							/>
						</div>
					)}

					{/* Email */}
					<div className="flex items-center justify-between">
						<div className="flex items-start gap-3">
							<div className="p-2 bg-green-50 rounded-lg text-[#16a34a]">
								<ContactTotalEmailsIcon width={20} height={20} />
							</div>
							<div>
								<div className="font-medium">
									{__('Email', 'doublescale')}
								</div>
								<div className="text-sm text-muted-foreground">
									{__(
										'Receive notifications via email (max 1,000/day site-wide).',
										'doublescale'
									)}
								</div>
							</div>
						</div>
						<Switch
							checked={preferences.channels.email}
							onCheckedChange={(checked) =>
								updateChannel('email', checked)
							}
						/>
					</div>

					{/* Browser */}
					{hasBrowser && (
						<div className="flex items-center justify-between">
							<div className="flex items-start gap-3">
								<div className="p-2 bg-purple-50 rounded-lg">
									<DesktopNotificationsIcon width={20} height={20} color="#9333ea" />
								</div>
								<div>
									<div className="font-medium flex items-center gap-2">
										{__('Browser', 'doublescale')}
										{browserPermission === 'granted' && (
											<Badge
												variant="default"
												className="bg-green-500 text-xs px-1.5 py-0"
											>
												{__(
													'Permission granted',
													'doublescale'
												)}
											</Badge>
										)}
										{browserPermission === 'denied' && (
											<Badge
												variant="destructive"
												className="text-xs px-1.5 py-0"
											>
												{__('Blocked', 'doublescale')}
											</Badge>
										)}
										{browserPermission === 'default' && (
											<Badge
												variant="secondary"
												className="text-xs px-1.5 py-0"
											>
												{__(
													'Permission needed',
													'doublescale'
												)}
											</Badge>
										)}
									</div>
									<div className="text-sm text-muted-foreground">
										{__(
											'Show desktop notifications when DoubleScale tab is not focused.',
											'doublescale'
										)}
									</div>
								</div>
							</div>
							<Switch
								checked={preferences.channels.browser}
								onCheckedChange={(checked) =>
									updateChannel('browser', checked)
								}
								disabled={browserPermission !== 'granted'}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pro upsell — shown when neither Pro channel is available */}
			{!showBell && !channelsAllowed.browser && <ProChannelsUpsell />}

			{/* Browser Permission Management */}
			{hasBrowser && browserPermission !== 'granted' && (
				<Card>
					<CardHeader>
						<CardTitle>
							{__('Browser Permission', 'doublescale')}
						</CardTitle>
						<CardDescription>
							{__(
								'Grant browser permission to receive desktop notifications.',
								'doublescale'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<div className="text-sm text-muted-foreground">
									{browserPermission === 'denied' &&
										__(
											"Browser notifications are blocked. To enable, click your browser's site settings icon in the address bar and allow notifications.",
											'doublescale'
										)}
									{browserPermission === 'default' &&
										__(
											"Allow DoubleScale to show you notifications via your operating system's notification center.",
											'doublescale'
										)}
								</div>
							</div>
							{browserPermission === 'default' && (
								<Button
									onClick={onRequestPermission}
									disabled={isRequestingPermission}
									size="sm"
								>
									{isRequestingPermission ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											{__(
												'Requesting...',
												'doublescale'
											)}
										</>
									) : (
										<>
											<span className="mr-2 inline-flex"><NotificationIcon width={16} height={16} /></span>
											{__('Enable', 'doublescale')}
										</>
									)}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Browser Notification Info (granted) */}
			{hasBrowser && browserPermission === 'granted' && (
				<Card>
					<CardHeader>
						<CardTitle>
							{__('Browser Notifications', 'doublescale')}
						</CardTitle>
						<CardDescription>
							{__(
								'Desktop notifications are enabled. Test them or learn how they work.',
								'doublescale'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								{__(
									'Send a test notification to verify everything is working.',
									'doublescale'
								)}
							</div>
							<Button
								onClick={onTestNotification}
								variant="outline"
								size="sm"
								disabled={testNotificationShown}
							>
								{testNotificationShown ? (
									<>
										<CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
										{__('Sent!', 'doublescale')}
									</>
								) : (
									<>
										<span className="mr-2 inline-flex"><DesktopNotificationsIcon width={16} height={16} /></span>
										{__('Test', 'doublescale')}
									</>
								)}
							</Button>
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex gap-3">
								<AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-blue-900">
									<div className="font-medium mb-1">
										{__(
											'How browser notifications work:',
											'doublescale'
										)}
									</div>
									<ul className="list-disc list-inside space-y-1">
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
					</CardContent>
				</Card>
			)}

			{/* Per-Category Toggles — categories as a subtab rail, the selected
			    category's subcategories shown with Bell / Email / Browser
			    switches (no push). */}
			<Card>
				<CardHeader>
					<CardTitle>
						{__('What you get notified about', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__(
							'Pick a category, then choose which notifications you want on desktop.',
							'doublescale'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{categoryKeys.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							{__(
								'No notification categories are available yet.',
								'doublescale'
							)}
						</div>
					) : (
						<Tabs
							value={activeCategory}
							onValueChange={setActiveCategory}
						>
							{/* Horizontal category tabs with icons */}
							<TabsList className="h-auto flex-row flex-wrap gap-1 bg-transparent p-0 mb-6">
								{categoryKeys.map((key) => (
									<TabsTrigger
										key={key}
										value={key}
										className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
									>
										{categories[key].label}
									</TabsTrigger>
								))}
							</TabsList>

							{/* Active category panel */}
							<div>
								{categoryKeys.map((key) => {
									const category = categories[key];
									const catSubs =
										subcategories[key] || {};
									const subEntries =
										Object.entries(catSubs);

									return (
										<TabsContent
											key={key}
											value={key}
											className="mt-0"
										>
											<div className="mb-4">
												<div className="font-medium">
													{category.label}
												</div>
												<div className="text-sm text-muted-foreground">
													{category.description}
												</div>
											</div>

											{/* Channel column header */}
											<div className="flex items-center justify-end gap-4 pb-3 border-b mb-3">
												<ChannelHeaderIcons
													showBell={showBell}
													showEmail={key !== 'booking'}
													hasBrowser={hasBrowser}
												/>
											</div>

											<div className="divide-y">
												{subEntries.map(
													([
														subKey,
														subInfo,
													]) => {
														const subPrefs =
															preferences
																.subcategories[
																subKey
															];
														if (!subPrefs)
															return null;
														return (
															<div
																key={
																	subKey
																}
																className="flex items-center justify-between gap-4 py-3"
															>
																<div className="min-w-0">
																	<div className="font-medium text-sm">
																		{
																			subInfo.label
																		}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		{
																			subInfo.description
																		}
																	</div>
																</div>
																<div className="flex items-center gap-2 shrink-0">
																	{canEditSalesTemplates &&
																	key === 'sales' ? (
																		<Button
																			type="button"
																			variant="outline"
																			size="sm"
																			className="h-8"
																			onClick={() =>
																				setEditingSalesTemplate(
																					{
																						subKey,
																						label: subInfo.label,
																					}
																				)
																			}
																		>
																			<Pencil className="h-3.5 w-3.5 mr-1" />
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
																		key !== 'booking'
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
										</TabsContent>
									);
								})}
							</div>
						</Tabs>
					)}
				</CardContent>
			</Card>

			<div className="text-sm text-muted-foreground">
				{__(
					'Note: Disabling a global channel will disable all category toggles for that channel.',
					'doublescale'
				)}
			</div>

			{canManageRetentionSettings && <NotificationRetentionSettings />}

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

			<SaveButton hasChanges={hasChanges} isSaving={isSaving} onSave={onSave} />
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
}: {
	preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
	categories: ReturnType<typeof useNotificationPreferences>['categories'];
	subcategories: ReturnType<typeof useNotificationPreferences>['subcategories'];
	updateChannel: ReturnType<typeof useNotificationPreferences>['updateChannel'];
	updateSubcategory: ReturnType<typeof useNotificationPreferences>['updateSubcategory'];
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
}) {
	const mobileGridCols = 'grid-cols-[1fr_60px]';
	const pushSiteWideEnabled = pushConfig?.enabled ?? false;
	const [openCategory, setOpenCategory] = useState<string>('');

	return (
		<div className="space-y-6">
			{/* 1. Mobile Push Setup — admin only, first element */}
			{canManagePushSetup && !whiteLabel?.enabled && (
				<Card>
					<CardHeader>
						<CardTitle>
							{__('Mobile Push Setup', 'doublescale')}
						</CardTitle>
						<CardDescription>
							{__(
								'Configure push notifications for the DoubleScale mobile app.',
								'doublescale'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label
									htmlFor="push-site-toggle"
									className="text-sm font-medium"
								>
									{__(
										'Enable Push Notifications',
										'doublescale'
									)}
								</Label>
								<p className="text-xs text-muted-foreground">
									{__(
										'When enabled, CRM events will trigger push notifications to mobile devices.',
										'doublescale'
									)}
								</p>
							</div>
							<Switch
								id="push-site-toggle"
								checked={pushSiteWideEnabled}
								onCheckedChange={onPushToggle}
								disabled={
									pushToggling || pushConfigLoading
								}
							/>
						</div>

						{pushSiteWideEnabled && pushConfig && (
							<div
								className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
									pushConfig.configured
										? 'border-green-200 bg-green-50'
										: pushConfig.credentials_available
											? 'border-yellow-200 bg-yellow-50'
											: 'border-red-200 bg-red-50'
								}`}
							>
								{pushConfig.configured ? (
									<>
										<CheckCircle2 className="w-[18px] h-[18px] text-green-600 flex-shrink-0" />
										<span className="text-sm font-medium text-green-800">
											{__(
												'Active — Push notifications are ready to be sent to mobile devices.',
												'doublescale'
											)}
										</span>
									</>
								) : pushConfig.credentials_available ? (
									<>
										<Loader2 className="w-[18px] h-[18px] animate-spin text-yellow-600 flex-shrink-0" />
										<span className="text-sm font-medium text-yellow-800">
											{__(
												'Initializing — push notification credentials are being set up.',
												'doublescale'
											)}
										</span>
									</>
								) : (
									<>
										<XCircle className="w-[18px] h-[18px] text-red-600 flex-shrink-0" />
										<span className="text-sm font-medium text-red-800">
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
							<>
								<div className="flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										{__(
											'Verify that your site can communicate with the push notification service.',
											'doublescale'
										)}
									</div>
									<Button
										onClick={onPushTest}
										disabled={pushTesting}
										variant="outline"
										size="sm"
									>
										{pushTesting ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												{__(
													'Testing...',
													'doublescale'
												)}
											</>
										) : (
											<>
												<Wifi className="w-4 h-4 mr-2" />
												{__(
													'Test Connection',
													'doublescale'
												)}
											</>
										)}
									</Button>
								</div>

								<div className="flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										{__(
											'Send a test notification to your mobile device to verify delivery.',
											'doublescale'
										)}
									</div>
									<Button
										onClick={onPushSend}
										disabled={pushSending}
										variant="outline"
										size="sm"
									>
										{pushSending ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												{__(
													'Sending...',
													'doublescale'
												)}
											</>
										) : (
											<>
												<span className="mr-2 inline-flex"><MobileNotificationsIcon width={16} height={16} /></span>
												{__(
													'Send Test Push',
													'doublescale'
												)}
											</>
										)}
									</Button>
								</div>
							</>
						)}

						{pushMessage && (
							<div
								className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
									pushMessage.type === 'success'
										? 'border-green-200 bg-green-50 text-green-800'
										: 'border-red-200 bg-red-50 text-red-800'
								}`}
							>
								{pushMessage.type === 'success' ? (
									<CheckCircle2 className="w-4 h-4 flex-shrink-0" />
								) : (
									<XCircle className="w-4 h-4 flex-shrink-0" />
								)}
								<span className="text-sm">
									{pushMessage.text}
								</span>
							</div>
						)}

						{pushSendMessage && (
							<div
								className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
									pushSendMessage.type === 'success'
										? 'border-green-200 bg-green-50 text-green-800'
										: 'border-red-200 bg-red-50 text-red-800'
								}`}
							>
								{pushSendMessage.type === 'success' ? (
									<CheckCircle2 className="w-4 h-4 flex-shrink-0" />
								) : (
									<XCircle className="w-4 h-4 flex-shrink-0" />
								)}
								<span className="text-sm">
									{pushSendMessage.text}
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* 2. Info Note */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex gap-3">
					<span className="mt-0.5 inline-flex shrink-0"><MobileNotificationsIcon width={20} height={20} color="#2563eb" /></span>
					<div className="text-sm text-blue-900">
						{__(
							'Push and in-app notifications will be sent to your mobile device if you have the DoubleScale app installed. You can also change your mobile notification settings in the DoubleScale mobile app.',
							'doublescale'
						)}
					</div>
				</div>
			</div>

			{/* 2b. Test Push — visible to all users when push is enabled */}
			{!pushConfigLoading && pushSiteWideEnabled && !canManagePushSetup && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								{__(
									'Send a test notification to your mobile device to verify delivery.',
									'doublescale'
								)}
							</div>
							<Button
								onClick={onPushSend}
								disabled={pushSending}
								variant="outline"
								size="sm"
							>
								{pushSending ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{__('Sending...', 'doublescale')}
									</>
								) : (
									<>
										<span className="mr-2 inline-flex"><MobileNotificationsIcon width={16} height={16} /></span>
										{__('Send Test Push', 'doublescale')}
									</>
								)}
							</Button>
						</div>
						{pushSendMessage && (
							<div
								className={`flex items-center gap-2 rounded-lg border px-4 py-3 mt-4 ${
									pushSendMessage.type === 'success'
										? 'border-green-200 bg-green-50 text-green-800'
										: 'border-red-200 bg-red-50 text-red-800'
								}`}
							>
								{pushSendMessage.type === 'success' ? (
									<CheckCircle2 className="w-4 h-4 flex-shrink-0" />
								) : (
									<XCircle className="w-4 h-4 flex-shrink-0" />
								)}
								<span className="text-sm">
									{pushSendMessage.text}
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* 3. Site-wide disabled warning */}
			{!pushConfigLoading && !pushSiteWideEnabled && (
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<div className="flex gap-3">
						<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div className="text-sm text-amber-900">
							{canManagePushSetup
								? __(
										'Push notifications are currently disabled. Enable them above to configure per-category settings.',
										'doublescale'
									)
								: __(
										'Push notifications are not enabled by your administrator. Contact your admin to enable mobile push notifications.',
										'doublescale'
									)}
						</div>
					</div>
				</div>
			)}

			{/* 4. Per-category push toggles — mobile-relevant only */}
			<Card>
				<CardHeader>
					<CardTitle>
						{__('Mobile notifications', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__(
							'Choose which notifications you receive on your mobile device.',
							'doublescale'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Global push channel toggle */}
					<div className="flex items-center justify-between pb-4 mb-4 border-b">
						<div className="flex items-start gap-3">
							<div className="p-2 bg-orange-50 rounded-lg">
								<MobileNotificationsIcon width={20} height={20} color="#ea580c" />
							</div>
							<div>
								<div className="font-medium">
									{__('Mobile Push', 'doublescale')}
								</div>
								<div className="text-sm text-muted-foreground">
									{__('Receive push notifications on your mobile device.', 'doublescale')}
								</div>
								{!pushSiteWideEnabled && !pushConfigLoading && (
									<div className="text-xs text-amber-600 mt-1">
										{__('Push notifications are not enabled by your administrator.', 'doublescale')}
									</div>
								)}
							</div>
						</div>
						<Switch
							checked={pushSiteWideEnabled && preferences.channels.push}
							onCheckedChange={(checked) => updateChannel('push', checked)}
							disabled={!pushSiteWideEnabled}
						/>
					</div>

					{/* Header */}
					<div
						className={`grid gap-4 pb-3 border-b mb-4 ${mobileGridCols}`}
					>
						<div className="text-sm font-medium text-muted-foreground">
							{__('Category', 'doublescale')}
						</div>
						<div className="text-sm font-medium text-muted-foreground text-center">
							<span className="mx-auto inline-flex"><MobileNotificationsIcon width={16} height={16} /></span>
						</div>
					</div>

					<div className="space-y-4">
						{Object.entries(categories)
							.filter(([key]) =>
								pushCategories.includes(key)
							)
							.map(([key, category]) => {
								const catSubs = subcategories[key] || {};
								const subEntries = Object.entries(
									catSubs
								).filter(
									([subKey]) =>
										!pushExcludedSubcategories.includes(
											subKey
										)
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
											className={`grid ${mobileGridCols} gap-4 items-center`}
										>
											<div>
												<div className="font-medium">
													{category.label}
												</div>
												<div className="text-sm text-muted-foreground">
													{category.description}
												</div>
											</div>
											<div className="flex justify-center">
												<Switch
													checked={
														pushSiteWideEnabled &&
														preferences.channels
															.push &&
														(subPrefs.push ??
															true)
													}
													onCheckedChange={(c) =>
														updateSubcategory(
															subKey,
															'push',
															c
														)
													}
													disabled={pushDisabled}
												/>
											</div>
										</div>
									);
								}

								return (
									<Accordion
										key={key}
										type="single"
										collapsible
										value={openCategory === key ? key : ''}
										onValueChange={(val) => setOpenCategory(val)}
									>
										<AccordionItem value={key}>
											<AccordionTrigger className="hover:no-underline">
												<div className="flex-1 text-left">
													<div className="font-medium">
														{category.label}
													</div>
													<div className="text-sm text-muted-foreground">
														{
															category.description
														}
													</div>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="space-y-3 pt-2 pl-4">
													{subEntries.map(
														([
															subKey,
															subInfo,
														]) => {
															const subPrefs =
																preferences
																	.subcategories[
																	subKey
																];
															if (!subPrefs)
																return null;
															return (
																<div
																	key={
																		subKey
																	}
																	className={`grid ${mobileGridCols} gap-4 items-center`}
																>
																	<div>
																		<div className="font-medium text-sm">
																			{
																				subInfo.label
																			}
																		</div>
																		<div className="text-xs text-muted-foreground">
																			{
																				subInfo.description
																			}
																		</div>
																	</div>
																	<div className="flex justify-center">
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
				</CardContent>
			</Card>

			<SaveButton hasChanges={hasChanges} isSaving={isSaving} onSave={onSave} />
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

	const { hasLimitedSettingsAccess, hasRequiredCapability } = useCapabilities();

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
	const whiteLabel = typeof ConfigAPI.getWhiteLabel === 'function' ? ConfigAPI.getWhiteLabel() : undefined;

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

		return { pushCategories: pushCats, pushExcludedSubcategories: excludedSubs };
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
				text: err?.message || __('Failed to update setting.', 'doublescale'),
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
					err?.message || __('Connection test failed.', 'doublescale'),
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
				text: err?.message || __('Failed to send test push.', 'doublescale'),
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

	const notificationTabsList = useMemo(
		() => [
			{
				value: 'email-desktop',
				label: __('Email & Desktop', 'doublescale'),
				icon: <DesktopNotificationsIcon width={24} height={24} />,
			},
			{
				value: 'mobile-app',
				label: __('Mobile app', 'doublescale'),
				icon: <MobileNotificationsIcon width={24} height={24} />,
			},
		],
		[]
	);

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
		/>
	);

	const notificationTabsContent = [
		{ value: 'email-desktop', children: emailDesktopContent },
		{
			value: 'mobile-app',
			children: (
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
				/>
			),
		},
	];

	return (
		<div className="space-y-6 max-w-4xl">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">
					{__('Notification Preferences', 'doublescale')}
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					{__(
						'Choose how and when you want to receive notifications.',
						'doublescale'
					)}
				</p>
			</div>

			{/* Sub-tabs. The Mobile (push) tab is a Pro channel — only shown when
			    push is available on this install. With push unavailable there is a
			    single panel, so we drop the tab chrome entirely. */}
			{channelsAllowed.push ? (
				<PageTabs
					defaultValue={activeChannelTab}
					value={activeChannelTab}
					onValueChange={setActiveChannelTab}
					tabsList={notificationTabsList}
					tabsContent={notificationTabsContent}
					enableHorizontalScroll
					tabsListWrapperClassName=""
					tabsListClassName="gap-2 bg-transparent text-foreground"
					scrollArrowBg="bg-white"
				/>
			) : (
				emailDesktopContent
			)}
		</div>
	);
}

export default NotificationPreferences;
