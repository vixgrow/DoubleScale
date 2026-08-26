/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef as useWordPressRef,
	useMemo,
	useCallback,
} from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * DoubleScale dependencies
 */
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Settings, NoticeMessage } from '@doublescale/client';
import {
	PageHeader,
	NoticeBanner,
	PageTabs,
	BusinessIcon,
	ContactTotalEmailsIcon,
	CartIcon,
	CurrencyIcon,
	CustomFieldsIcon,
	ToolsIcon,
	TotalSMSIcon,
	LicenseIcon,
	LinkTriggersIcon,
	MailboxIcon,
	NotificationIcon,
	WhatsAppIcon,
	WebsiteTrackingIcon,
	AiIcon,
	ClientPortalIcon,
	FailedEmailsIcon,
} from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import { NotificationPreferences } from './notification-preferences';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import BusinessSettings from './business';
import EmailSettings from './email';
import MailboxSettings from './mailbox';
import McpSettings from './mcp';
import { BounceHandler } from '@/components/bounce-handler';
import SettingsShimmer from './settings-shimmer';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CurrenciesSettings from './currencies';
import SystemSettings from './system';
import License from './license';
import ClientPortalSettings from './client-portal';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
// import LinkTriggers from '../link-triggers'; // Moved to Pro
// import CartSettings from './cart'; // Moved to Pro

const CUSTOM_FIELDS_PRO_FEATURES = [
	__(
		'Create field groups and custom fields for contacts and deals',
		'doublescale'
	),
	__(
		'Use custom fields in contact records, automations, and merge tags',
		'doublescale'
	),
	__(
		'Drag-and-drop ordering and full REST API management',
		'doublescale'
	),
];

const WEBSITE_TRACKING_PRO_FEATURES = [
	__('Track page visits for contacts on your website', 'doublescale'),
	__('Stitch anonymous visitors to contacts on first identify', 'doublescale'),
	__('Configure data retention with per-day or keep-forever rules', 'doublescale'),
];

const TABS_WITHOUT_SAVE_BUTTON_LIST = [
	'custom_fields',
	'link_triggers',
	'system',
	// MCP saves through its own endpoint the moment the switch is flipped.
	'mcp',
	'license',
	'debugging',
	'notifications',
	'mailbox',
	'client_portal',
	'bounce_handler',
];

const SETTINGS_DEPENDENT_TABS = new Set([
	'business',
	'email',
	'sms',
	'whatsapp',
	'cart',
	'currencies',
	'website_tracking',
	'ai',
]);

// Tabs that Sales Reps and Sales Managers can access (limited settings)
const SALES_REP_ALLOWED_TABS = new Set(['notifications', 'mailbox']);

// Tabs whose content is 100% Pro-gated (renders only a ProFeatureNotice
// stub in Free) — hidden entirely rather than shown-then-blocked.
const PRO_ONLY_TAB_VALUES = new Set([
	'sms',
	'whatsapp',
	'cart',
	'website_tracking',
	'custom_fields',
	'link_triggers',
	'ai',
	'bounce_handler',
]);

const SettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const { tab: urlTab, subtab: urlSubtab } = useParams<{
		tab?: string;
		subtab?: string;
	}>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [saveCounter, setSaveCounter] = useState<number>(0);
	const originalSettingsRef = useWordPressRef<Settings | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const {
		hasLimitedSettingsAccess: checkLimitedSettingsAccess,
		canManageOwnMcpKey: checkCanReachMcpTab,
	} = useCapabilities();

	const TABS_WITHOUT_SAVE_BUTTON = useMemo(
		() => new Set(applyFilters('doublescale_settings_tabs_without_save', TABS_WITHOUT_SAVE_BUTTON_LIST) as string[]),
		[]
	);

	// Prefer PHP `doublescale_limited_settings` so CRM Manager + Sales Rep
	// multi-role users keep full Settings access (Mailbox/Notifications only
	// for pure Sales Rep / Sales Manager).
	const hasLimitedSettingsAccess = checkLimitedSettingsAccess();
	// Any DoubleScale role may open the MCP tab to manage their own key; the
	// admin-only controls inside it gate separately on doublescale_manage_mcp.
	const canReachMcpTab = checkCanReachMcpTab();
	const defaultTab = hasLimitedSettingsAccess ? 'notifications' : 'business';
	const [activeTab, setActiveTab] = useState<string>(defaultTab);

	// Sync activeTab with URL param
	useEffect(() => {
		if (urlTab && urlTab !== 'tab?') {
			if (urlTab === 'modules') {
				navigate(getToLink(`settings/${defaultTab}`), { replace: true });
				return;
			}
			if (urlTab === 'team') {
				navigate(getToLink('team-managers'), { replace: true });
				return;
			}
			// If user with limited access tries to access a restricted tab, redirect to notifications
			if (hasLimitedSettingsAccess && !SALES_REP_ALLOWED_TABS.has(urlTab)) {
				navigate(getToLink('settings/notifications'), { replace: true });
				return;
			}
			if (urlTab === 'mcp' && !canReachMcpTab) {
				navigate(getToLink(`settings/${defaultTab}`), { replace: true });
				return;
			}
			setActiveTab(urlTab);
		} else if (!urlTab || urlTab === 'tab?') {
			// If no valid tab in URL, redirect to default tab
			navigate(getToLink(`settings/${defaultTab}`), { replace: true });
		}
	}, [
		urlTab,
		navigate,
		hasLimitedSettingsAccess,
		canReachMcpTab,
		defaultTab,
	]);

	const fetchSettings = async () => {
		try {
			const response = await apiFetch({
				path: '/doublescale/v1/settings',
			});

			const settingsData = response as Settings;
			setSettings(settingsData);
			originalSettingsRef.current = JSON.parse(
				JSON.stringify(settingsData)
			);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to fetch settings', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		navigate(getToLink(`settings/${value}`));
	};

	const updateSettings = async () => {
		setIsUpdating(true);
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings',
				method: 'POST',
				data: settings,
			});

			// Update the original settings ref after successful save
			originalSettingsRef.current = JSON.parse(JSON.stringify(settings));
			setSaveCounter((prev) => prev + 1);

			if (
				settings?.business &&
				typeof window !== 'undefined' &&
				window.doublescaleConfig
			) {
				window.doublescaleConfig.business = settings.business;
			}

			// Keep the in-memory currency in sync so every module (proposals,
			// invoices, contracts, credit notes, deals) picks up the new global
			// currency without a full page reload. The raw payload is updated too
			// so any config re-created from it (free/pro keep separate ConfigAPI
			// instances) stays correct.
			const nextCurrency = settings?.currency?.currency;
			if (nextCurrency) {
				config.setCurrency(nextCurrency);
				if (
					typeof window !== 'undefined' &&
					window.doublescaleConfig
				) {
					window.doublescaleConfig.currency = nextCurrency;
				}
			}

			// Check for warnings in the response
			if (response?.warnings && response.warnings.length > 0) {
				// Show warning message
				setNotice({
					type: 'warning',
					message: response.warnings.join(' '),
				});
			} else {
				// Show success message if no warnings
				setNotice({
					type: 'success',
					message: __('Settings updated successfully', 'doublescale'),
				});
			}
		} catch (error: any) {
			// Extract error message from API response
			let errorMessage = __('Failed to update settings', 'doublescale');

			if (error?.message) {
				errorMessage = error.message;
			} else if (error?.data?.message) {
				errorMessage = error.data.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			setNotice({
				type: 'error',
				message: errorMessage,
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// Check if settings have changed from the last saved snapshot.
	const hasChanges = useMemo(() => {
		if (!settings || !originalSettingsRef.current) {
			return false;
		}
		return (
			JSON.stringify(settings) !==
			JSON.stringify(originalSettingsRef.current)
		);
	}, [settings, saveCounter]);

	const handleSettingsChange = useCallback((nextSettings: Settings) => {
		setSettings((prev) => {
			if (
				prev &&
				JSON.stringify(prev) === JSON.stringify(nextSettings)
			) {
				return prev;
			}
			return nextSettings;
		});
	}, []);

	useEffect(() => {
		// Sales Reps and Sales Managers only see tabs that don't require main settings (e.g., notifications)
		// Skip fetching settings to avoid 403 error
		if (hasLimitedSettingsAccess) {
			setIsLoading(false);
			return;
		}
		fetchSettings();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const renderTabBody = (currentTab: string) => {
		switch (currentTab) {
			case 'business':
				return (
					<BusinessSettings
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'email':
				const EmailComponent = applyFilters(
					'doublescale_settings_email_settings',
					EmailSettings
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<EmailComponent
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'mailbox':
				return <MailboxSettings />;
			case 'sms':
				const SMSComponent = applyFilters(
					'doublescale_settings_sms_settings',
					() => (
						<ProFeatureNotice
							featureName={__('SMS Settings', 'doublescale')}
							description={__(
								'Configure SMS sending rate limits and manage SMS campaign settings with DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<SMSComponent settings={settings!} onChange={handleSettingsChange} />
				);
			case 'whatsapp':
				const WhatsAppComponent = applyFilters(
					'doublescale_settings_whatsapp_settings',
					() => (
						<ProFeatureNotice
							featureName={__('WhatsApp Settings', 'doublescale')}
							description={__(
								'Configure WhatsApp sending rate limits and manage Meta WhatsApp Business templates with DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<WhatsAppComponent
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'cart':
				const CartComponent = applyFilters(
					'doublescale_settings_cart_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Cart Settings', 'doublescale')}
							description={__(
								'Track abandoned carts, set up GDPR compliance, and automate cart recovery with DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<CartComponent
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'system':
				return <SystemSettings />;
			case 'mcp':
				return <McpSettings />;
			case 'currencies':
				return (
					<CurrenciesSettings
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'website_tracking':
				const WebsiteTrackingComponent = applyFilters(
					'doublescale_settings_website_tracking_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Website Tracking', 'doublescale')}
							description={__(
								'Track page visits for contacts on your website and manage data retention settings with DoubleScale Pro.',
								'doublescale'
							)}
							features={WEBSITE_TRACKING_PRO_FEATURES}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<WebsiteTrackingComponent
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
			case 'bounce_handler': {
				const BounceHandlerComponent = applyFilters(
					'doublescale_settings_bounce_handler_settings',
					BounceHandler
				) as React.ComponentType;
				return <BounceHandlerComponent />;
			}
			case 'license':
				return <License />;
			case 'client_portal':
				return <ClientPortalSettings />;
			case 'custom_fields': {
				const CustomFieldsSettingsComponent = applyFilters(
					'doublescale_settings_custom_fields_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Custom Fields', 'doublescale')}
							description={__(
								'Define groups and custom fields for contacts and deals, manage values on records, and use them in automations with DoubleScale Pro.',
								'doublescale'
							)}
							features={CUSTOM_FIELDS_PRO_FEATURES}
						/>
					)
				) as React.ComponentType;
				return <CustomFieldsSettingsComponent />;
			}
			case 'link_triggers':
				const LinkTriggersComponent = applyFilters(
					'doublescale_settings_link_triggers_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Link Triggers', 'doublescale')}
							description={__(
								'Create trackable short links that count clicks, fire automations, and sync tags or lists on the contact — available with DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)
				) as React.ComponentType;
				return <LinkTriggersComponent />;
			case 'ai':
				const AIComponent = applyFilters(
					'doublescale_settings_ai_settings',
					() => (
						<ProFeatureNotice
							featureName={__('AI Email Builder', 'doublescale')}
							description={__(
								'Configure AI providers to generate email templates with artificial intelligence using DoubleScale Pro.',
								'doublescale'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<AIComponent
						settings={settings!}
						onChange={handleSettingsChange}
					/>
				);
	case 'notifications':
			// The notification engine + email channel now ship in Free, so the
			// preferences UI is always available. Bell/desktop/push rows inside
			// the component are gated off the API's allowed-channels payload, and
			// the component shows a Pro upsell when those channels are absent.
			// The filter is retained so Pro (or third parties) can still swap the
			// whole panel, but Free renders the real component by default.
			const NotificationsComponent = applyFilters(
				'doublescale_settings_notifications_settings',
				NotificationPreferences
			) as React.ComponentType<{ initialCategory?: string }>;
			return <NotificationsComponent initialCategory={urlSubtab} />;
		default: {
			const DynamicComponent = applyFilters(
				`doublescale_settings_${currentTab}_settings`,
				null
			) as React.ComponentType | null;
			if (DynamicComponent) {
				return <DynamicComponent />;
			}
			return null;
		}
		}
	};

	const allTabsList = [
		{
			value: 'business',
			label: __('Business', 'doublescale'),
			icon: <BusinessIcon />,
		},
		{
			value: 'email',
			label: __('Email', 'doublescale'),
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{
			value: 'mailbox',
			label: __('Mailbox', 'doublescale'),
			icon: <MailboxIcon width={24} height={24} />,
		},
		{
			value: 'sms',
			label: 'SMS',
			icon: <TotalSMSIcon width={24} height={24} />,
		},
		{
			value: 'whatsapp',
			label: 'WhatsApp',
			icon: <WhatsAppIcon width={24} height={24} />,
		},
		{
			value: 'cart',
			label: __('Cart', 'doublescale'),
			icon: <CartIcon />,
		},
		{
			value: 'currencies',
			label: __('Currencies', 'doublescale'),
			icon: <CurrencyIcon />,
		},
		{
			value: 'website_tracking',
			label: __('Website Tracking', 'doublescale'),
			icon: <WebsiteTrackingIcon width={24} height={24} />,
		},
		{
			value: 'client_portal',
			label: __('Client Portal', 'doublescale'),
			icon: <ClientPortalIcon width={24} height={24} />,
		},
		{
			value: 'bounce_handler',
			label: __('Bounce Handler', 'doublescale'),
			icon: <FailedEmailsIcon width={24} height={24} />,
		},
		{
			value: 'license',
			label: __('License', 'doublescale'),
			icon: <LicenseIcon />,
		},
		{
			value: 'system',
			label: __('System', 'doublescale'),
			icon: <ToolsIcon width={24} height={24} />,
		},
		{
			value: 'custom_fields',
			label: __('Custom Fields', 'doublescale'),
			icon: <CustomFieldsIcon width={24} height={24} />,
		},
		{
			value: 'link_triggers',
			label: __('Link Triggers', 'doublescale'),
			icon: <LinkTriggersIcon width={24} height={24} />,
		},
		{
			value: 'ai',
			label: 'AI',
			icon: <AiIcon width={24} height={24} />,
		},
		{
			value: 'mcp',
			label: __('MCP for AI Agents', 'doublescale'),
			icon: <AiIcon width={24} height={24} />,
		},
		{
			value: 'notifications',
			label: __('Notifications', 'doublescale'),
			icon: <NotificationIcon width={24} height={24} />,
		},
	];

	const filteredTabsList = (
		applyFilters('doublescale_settings_tabs_list', allTabsList) as typeof allTabsList
	).filter((tab) => !PRO_ONLY_TAB_VALUES.has(tab.value) || isProActive());

	// Filter tabs based on user role - Sales Reps and Sales Managers only see allowed tabs
	const tabsList = useMemo(() => {
		let tabs = filteredTabsList;
		// Hide the Client Portal settings tab while the Portal module is disabled
		// (see Portal/Module.php::is_enabled). Auto-restores when the module is re-enabled.
		if (!config.isModuleToggleEnabled('portal')) {
			tabs = tabs.filter((tab) => tab.value !== 'client_portal');
		}
		if (hasLimitedSettingsAccess) {
			tabs = tabs.filter((tab) => SALES_REP_ALLOWED_TABS.has(tab.value));
		}
		if (!canReachMcpTab) {
			tabs = tabs.filter((tab) => tab.value !== 'mcp');
		}
		return tabs;
	}, [filteredTabsList, hasLimitedSettingsAccess, canReachMcpTab]);

	const tabsContent = tabsList.map(({ value }) => {
		if (activeTab !== value) {
			return { value, children: null };
		}

		const requiresSettings = SETTINGS_DEPENDENT_TABS.has(value);
		const content =
			requiresSettings && (isLoading || !settings) ? (
				<SettingsShimmer />
			) : (
				renderTabBody(value)
			);

		return {
			value,
			children: (
		<Card className="flex flex-col mt-4 bg-white border-0 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]">
				<CardContent
					className={`flex-1 ${
						value === 'custom_fields'
							? 'px-6 py-0 pb-6'
							: 'p-6'
					}`}
				>
					{content}
				</CardContent>
				{!TABS_WITHOUT_SAVE_BUTTON.has(value) ? (
					<CardFooter className="bg-white rounded-b-xl p-4 mt-auto justify-end">
						<Button
							onClick={updateSettings}
							disabled={isUpdating || !hasChanges}
							className="min-w-[120px] rounded-lg px-0"
							variant="gradient"
						>
							{isUpdating
								? __('Saving...', 'doublescale')
								: __('Save Settings', 'doublescale')}
						</Button>
					</CardFooter>
				) : null}
			</Card>
			),
		};
	});

	return (
		<div className="doublescale-settings">
			<PageHeader
				title={__('Settings', 'doublescale')}
				subtitle={__('Settings', 'doublescale')}
				actions={[]}
			/>

			{notice && (
				<NoticeBanner
					ref={noticeBannerRef}
					notice={notice}
					closeNotice={closeNotice}
				/>
			)}

			<PageTabs
				defaultValue={activeTab}
				value={activeTab}
				onValueChange={handleTabChange}
				tabsList={tabsList}
				tabsContent={tabsContent}
				enableHorizontalScroll
				scrollArrowBg="bg-white"
				tabsListWrapperClassName="min-w-0 py-3 px-2.5 rounded-lg bg-white shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]"
				tabsListClassName="gap-2 bg-transparent text-foreground justify-start"
			/>
		</div>
	);
};

export default SettingsPage;
