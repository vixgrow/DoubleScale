/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Settings, NoticeMessage } from '@quillcrm/client';
import { PageHeader, NoticeBanner } from '@quillcrm/components';
import BusinessSettings from './business';
import EmailSettings from './email';
import DoubleOptInSettings from './double-optin';
import CartSettings from './cart';
import Managers from './managers';
import SettingsShimmer from './settings-shimmer';
import TabsSelection from './tabs-selection';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CurrenciesSettings from './currencies';

const SettingsPage: React.FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [tab, setTab] = useState<string>('business');
	const [settings, setSettings] = useState<Settings | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [saveCounter, setSaveCounter] = useState<number>(0);
	const originalSettingsRef = useRef<Settings | null>(null);

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

	const renderTabContent = () => {
		if (isLoading || !settings) {
			return <SettingsShimmer />;
		}

		switch (tab) {
			case 'business':
				return (
					<BusinessSettings
						settings={settings}
						onChange={setSettings}
					/>
				);
			case 'email':
				return (
					<EmailSettings settings={settings} onChange={setSettings} />
				);
			case 'double_optin':
				return (
					<DoubleOptInSettings
						settings={settings}
						onChange={setSettings}
					/>
				);
			case 'cart':
				return (
					<CartSettings settings={settings} onChange={setSettings} />
				);
			case 'managers':
				return <Managers />;
			case 'currencies':
				return (
					<CurrenciesSettings settings={settings} onChange={setSettings} />
				);
			default:
				return null;
		}
	};

	return (
		<div className="quillcrm-settings">
			<PageHeader
				title={__('Settings', 'quillcrm')}
				subtitle={__('Settings', 'quillcrm')}
				actions={[]}
			/>

			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}

			<div className="grid grid-cols-12 gap-4">
				{/* Tabs Card */}
				<div className="col-span-3">
					<TabsSelection activeTab={tab} onTabChange={setTab} />
				</div>

				{/* Content Card */}
				<div className="col-span-9">
					<Card className="flex shadow-none bg-[#F8F8F8] flex-col h-[calc(100vh-200px)]">
						{/* Scrollable Content */}
						<CardContent className="flex-1 overflow-y-auto p-6">
							{renderTabContent()}
						</CardContent>

						{/* Fixed Footer */}
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
					</Card>
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;