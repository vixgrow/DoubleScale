/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useRef as useWordPressRef,
	useMemo,
} from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * QuillCRM dependencies
 */
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Settings, NoticeMessage } from '@quillcrm/client';
import {
	PageHeader,
	NoticeBanner,
	PageTabs,
	BusinessIcon,
	ContactTotalEmailsIcon,
	DoubleOptInIcon,
	CartIcon,
	CurrencyIcon,
	CustomFieldsIcon,
	ToolsIcon,
	TotalSMSIcon,
	ManagerIcon,
	LicenseIcon,
	ProcessingEmailsIcon,
	LinkTriggersIcon,
	WhatsAppIcon,
	WebsiteIcon,
} from '@quillcrm/components';
import { Bell } from 'lucide-react';
import { ProFeatureNotice } from '@quillcrm/components/pro-feature-notice';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import BusinessSettings from './business';
import EmailSettings from './email';
import SMTPSettings from './smtp';
import DoubleOptInSettings from './double-optin';
import Managers from './managers';
import SettingsShimmer from './settings-shimmer';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CurrenciesSettings from './currencies';
import SystemSettings from './system';
import License from './license';
// import CustomFields from '../custom-fields'; // Moved to Pro
// import LinkTriggers from '../link-triggers'; // Moved to Pro
// import CartSettings from './cart'; // Moved to Pro

const TABS_WITHOUT_SAVE_BUTTON = new Set([
	'custom_fields',
	'link_triggers',
	'system',
	'managers',
	'license',
	'smtp',
	'whatsapp',
	'debugging',
	'notifications',
]);
const SETTINGS_DEPENDENT_TABS = new Set([
	'business',
	'email',
	'sms',
	'double_optin',
	'cart',
	'currencies',
	'website_tracking',
]);

// Tabs that Sales Reps and Sales Managers can access (limited settings)
const SALES_REP_ALLOWED_TABS = new Set(['notifications']);

const SettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const { tab: urlTab } = useParams<{ tab?: string }>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [saveCounter, setSaveCounter] = useState<number>(0);
	const originalSettingsRef = useWordPressRef<Settings | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const { isSalesRep, isSalesManager, isCrmManager } = useCapabilities();
	
	// Memoize the role checks to avoid recalculating on every render
	// Sales Rep and Sales Manager have limited settings access
	const hasLimitedSettingsAccess = useMemo(() => isSalesRep() || (isSalesManager() && !isCrmManager()), []);
	const defaultTab = hasLimitedSettingsAccess ? 'notifications' : 'business';
	const [activeTab, setActiveTab] = useState<string>(defaultTab);

	// Sync activeTab with URL param
	useEffect(() => {
		if (urlTab && urlTab !== 'tab?') {
			// If user with limited access tries to access a restricted tab, redirect to notifications
			if (hasLimitedSettingsAccess && !SALES_REP_ALLOWED_TABS.has(urlTab)) {
				navigate(getToLink('settings/notifications'), { replace: true });
				return;
			}
			setActiveTab(urlTab);
		} else if (!urlTab || urlTab === 'tab?') {
			// If no valid tab in URL, redirect to default tab
			navigate(getToLink(`settings/${defaultTab}`), { replace: true });
		}
	}, [urlTab, navigate, hasLimitedSettingsAccess, defaultTab]);

	const fetchSettings = async () => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/settings',
			});

			const settingsData = response as Settings;
			setSettings(settingsData);
			originalSettingsRef.current = JSON.parse(
				JSON.stringify(settingsData)
			);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to fetch settings', 'quillcrm'),
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
				path: '/qc/v1/settings',
				method: 'POST',
				data: settings,
			});

			// Update the original settings ref after successful save
			originalSettingsRef.current = JSON.parse(JSON.stringify(settings));
			setSaveCounter((prev) => prev + 1);

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
					message: __('Settings updated successfully', 'quillcrm'),
				});
			}
		} catch (error: any) {
			// Extract error message from API response
			let errorMessage = __('Failed to update settings', 'quillcrm');

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

	// Check if settings have changed
	const hasChanges = useMemo(() => {
		if (!settings || !originalSettingsRef.current) {
			return false;
		}
		return (
			JSON.stringify(settings) !==
			JSON.stringify(originalSettingsRef.current)
		);
	}, [settings, saveCounter]);

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
						onChange={setSettings}
					/>
				);
			case 'email':
				const EmailComponent = applyFilters(
					'quillcrm_settings_email_settings',
					EmailSettings
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<EmailComponent
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'smtp':
				const SMTPComponent = applyFilters(
					'quillcrm_settings_smtp_settings',
					SMTPSettings
				) as React.ComponentType;
				return <SMTPComponent />;
			case 'sms':
				const SMSComponent = applyFilters(
					'quillcrm_settings_sms_settings',
					() => (
						<ProFeatureNotice
							featureName={__('SMS Settings', 'quillcrm')}
							description={__(
								'Configure SMS sending rate limits and manage SMS campaign settings with QuillCRM Pro.',
								'quillcrm'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<SMSComponent settings={settings!} onChange={setSettings} />
				);
			case 'whatsapp':
				const WhatsAppComponent = applyFilters(
					'quillcrm_settings_whatsapp_settings',
					() => (
						<ProFeatureNotice
							featureName={__('WhatsApp Settings', 'quillcrm')}
							description={__(
								'Configure WhatsApp sending rate limits and manage Meta WhatsApp Business templates with QuillCRM Pro.',
								'quillcrm'
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
						onChange={setSettings}
					/>
				);
			case 'double_optin':
				return (
					<DoubleOptInSettings
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'cart':
				const CartComponent = applyFilters(
					'quillcrm_settings_cart_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Cart Settings', 'quillcrm')}
							description={__(
								'Track abandoned carts, set up GDPR compliance, and automate cart recovery with QuillCRM Pro.',
								'quillcrm'
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
						onChange={setSettings}
					/>
				);
			case 'managers':
				return <Managers />;
			case 'system':
				return <SystemSettings />;
			case 'currencies':
				return (
					<CurrenciesSettings
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'website_tracking':
				const WebsiteTrackingComponent = applyFilters(
					'quillcrm_settings_website_tracking_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Website Tracking', 'quillcrm')}
							description={__(
								'Track page visits for contacts on your website and manage data retention settings with QuillCRM Pro.',
								'quillcrm'
							)}
						/>
					)
				) as React.ComponentType<{
					settings: Settings;
					onChange: (settings: Settings) => void;
				}>;
				return (
					<WebsiteTrackingComponent
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'license':
				return <License />;
			case 'custom_fields':
				const CustomFieldsComponent = applyFilters(
					'quillcrm_settings_custom_fields_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Custom Fields', 'quillcrm')}
							description={__(
								'Create and manage custom fields to capture additional contact information tailored to your business needs.',
								'quillcrm'
							)}
						/>
					)
				) as React.ComponentType;
				return <CustomFieldsComponent />;
			case 'link_triggers':
				const LinkTriggersComponent = applyFilters(
					'quillcrm_settings_link_triggers_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Link Triggers', 'quillcrm')}
							description={__(
								'Create trackable links with automated actions. Track clicks, auto-login users, and trigger automations with QuillCRM Pro.',
								'quillcrm'
							)}
						/>
					)
				) as React.ComponentType;
				return <LinkTriggersComponent />;
			case 'notifications':
				const NotificationsComponent = applyFilters(
					'quillcrm_settings_notifications_settings',
					() => (
						<ProFeatureNotice
							featureName={__('Notification Preferences', 'quillcrm')}
							description={__(
								'Configure how you receive notifications via bell icon and email with QuillCRM Pro.',
								'quillcrm'
							)}
						/>
					)
				) as React.ComponentType;
				return <NotificationsComponent />;
			default:
				return null;
		}
	};

	const allTabsList = [
		{
			value: 'business',
			label: 'Business',
			icon: <BusinessIcon />,
		},
		{
			value: 'email',
			label: 'Email',
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{
			value: 'smtp',
			label: 'SMTP',
			icon: <ProcessingEmailsIcon width={24} height={24} />,
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
			value: 'double_optin',
			label: 'Double Opt-In',
			icon: <DoubleOptInIcon />,
		},
		{
			value: 'cart',
			label: 'Cart',
			icon: <CartIcon />,
		},
		{
			value: 'currencies',
			label: 'Currencies',
			icon: <CurrencyIcon />,
		},
		{
			value: 'website_tracking',
			label: 'Website Tracking',
			icon: <WebsiteIcon width={24} height={24} />,
		},
		{
			value: 'license',
			label: 'License',
			icon: <LicenseIcon />,
		},
		{
			value: 'system',
			label: 'System',
			icon: <ToolsIcon width={24} height={24} />,
		},
		{
			value: 'managers',
			label: 'Managers',
			icon: <ManagerIcon width={24} height={24} />,
		},
		{
			value: 'custom_fields',
			label: 'Custom Fields',
			icon: <CustomFieldsIcon width={24} height={24} />,
		},
		{
			value: 'link_triggers',
			label: 'Link Triggers',
			icon: <LinkTriggersIcon width={24} height={24} />,
		},
		{
			value: 'notifications',
			label: 'Notifications',
			icon: <Bell size={24} />,
		},
	];

	// Filter tabs based on user role - Sales Reps and Sales Managers only see allowed tabs
	const tabsList = hasLimitedSettingsAccess
		? allTabsList.filter((tab) => SALES_REP_ALLOWED_TABS.has(tab.value))
		: allTabsList;

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
				<Card
					className={`flex shadow-none flex-col mt-4 ${
						value === 'license'
							? 'bg-[#F8F8F8]'
							: TABS_WITHOUT_SAVE_BUTTON.has(value)
								? 'bg-white'
								: 'bg-[#F8F8F8]'
					}`}
				>
					<CardContent
						className={`flex-1 ${
							value === 'custom_fields'
								? 'px-6 py-0 pb-6'
								: TABS_WITHOUT_SAVE_BUTTON.has(value)
									? 'px-6 py-6'
									: 'p-6'
						}`}
					>
						{content}
					</CardContent>
					{!TABS_WITHOUT_SAVE_BUTTON.has(value) ? (
						<CardFooter className="border-t bg-white rounded-b-xl p-4 mt-auto justify-end">
							<Button
								onClick={updateSettings}
								disabled={isUpdating || !hasChanges}
								className="min-w-[120px] rounded-lg px-0"
								variant="gradient"
							>
								{isUpdating
									? __('Saving...', 'quillcrm')
									: __('Save Settings', 'quillcrm')}
							</Button>
						</CardFooter>
					) : null}
				</Card>
			),
		};
	});

	return (
		<div className="quillcrm-settings">
			<PageHeader
				title={__('Settings', 'quillcrm')}
				subtitle={__('Settings', 'quillcrm')}
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
				tabsListWrapperClassName="py-3 px-2.5 border rounded-lg"
				tabsListClassName="gap-2 bg-transparent text-foreground justify-center"
			/>
		</div>
	);
};

export default SettingsPage;
