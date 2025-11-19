/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef as useWordPressRef, useMemo } from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

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
} from '@quillcrm/components';
import BusinessSettings from './business';
import EmailSettings from './email';
import SMSSettings from './sms';
import DoubleOptInSettings from './double-optin';
import CartSettings from './cart';
import Managers from './managers';
import SettingsShimmer from './settings-shimmer';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CurrenciesSettings from './currencies';
// import CustomFields from '../custom-fields'; // Moved to Pro
import LinkTriggers from '../link-triggers';
import { UserRound, MessageSquare } from 'lucide-react';

const TABS_WITHOUT_SAVE_BUTTON = new Set(['custom_fields', 'link_triggers']);
const SETTINGS_DEPENDENT_TABS = new Set([
	'business',
	'email',
	'sms',
	'double_optin',
	'cart',
	'currencies',
]);

const SettingsPage: React.FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [tab, setTab] = useState<string>('business');
	const [settings, setSettings] = useState<Settings | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [saveCounter, setSaveCounter] = useState<number>(0);
	const originalSettingsRef = useWordPressRef<Settings | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const fetchSettings = async () => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/settings',
			});

			const settingsData = response as Settings;
			setSettings(settingsData);
			originalSettingsRef.current = JSON.parse(JSON.stringify(settingsData));
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to fetch settings', 'quillcrm'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const updateSettings = async () => {
		setIsUpdating(true);
		try {
			await apiFetch({
				path: '/qc/v1/settings',
				method: 'POST',
				data: settings,
			});

			// Update the original settings ref after successful save
			originalSettingsRef.current = JSON.parse(JSON.stringify(settings));
			setSaveCounter((prev) => prev + 1);

			setNotice({
				type: 'success',
				message: __('Settings updated successfully', 'quillcrm'),
			});
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to update settings', 'quillcrm'),
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
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	// Check if settings have changed
	const hasChanges = useMemo(() => {
		if (!settings || !originalSettingsRef.current) {
			return false;
		}
		return JSON.stringify(settings) !== JSON.stringify(originalSettingsRef.current);
	}, [settings, saveCounter]);

	useEffect(() => {
		fetchSettings();
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
				return (
					<EmailSettings settings={settings!} onChange={setSettings} />
				);
			case 'sms':
				return (
					<SMSSettings settings={settings!} onChange={setSettings} />
				);
			case 'double_optin':
				return (
					<DoubleOptInSettings
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'cart':
				return (
					<CartSettings settings={settings!} onChange={setSettings} />
				);
			case 'managers':
				return <Managers />;
			case 'currencies':
				return (
					<CurrenciesSettings
						settings={settings!}
						onChange={setSettings}
					/>
				);
			case 'custom_fields':
				return <div className="p-4">{__('Custom Fields is a Pro feature', 'quillcrm')}</div>;
			case 'link_triggers':
				return <LinkTriggers />;
			default:
				return null;
		}
	};

	const tabsList = [
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
			value: 'sms',
			label: 'SMS',
			icon: <TotalSMSIcon width={24} height={24} />,
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
			icon: <ToolsIcon width={24} height={24} />,
		},
	];

	const tabsContent = tabsList.map(({ value }) => {
		if (tab !== value) {
			return { value, children: null };
		}

		const requiresSettings = SETTINGS_DEPENDENT_TABS.has(value);
		const content =
			requiresSettings && (isLoading || !settings)
				? <SettingsShimmer />
				: renderTabBody(value);

		return {
			value,
			children: (
				<Card
					className={`flex shadow-none flex-col mt-4 ${TABS_WITHOUT_SAVE_BUTTON.has(value) ? 'bg-white' : 'bg-[#F8F8F8]'
						}`}
				>
					<CardContent
						className={`flex-1 ${value === 'custom_fields'
							? 'px-6 py-0 pb-6'
							: TABS_WITHOUT_SAVE_BUTTON.has(value)
								? 'px-6 py-6'
								: 'p-6'
							}`}
					>
						{content}
					</CardContent>
					{!TABS_WITHOUT_SAVE_BUTTON.has(value) && (
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
					)}
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
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			<PageTabs
				defaultValue="business"
				onValueChange={setTab}
				tabsList={tabsList}
				tabsContent={tabsContent}
				tabsListWrapperClassName='py-3 px-2.5 border rounded-lg'
				tabsListClassName='gap-2 bg-transparent text-foreground justify-center'
			/>
		</div>
	);
};

export default SettingsPage;