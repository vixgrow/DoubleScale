/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useApi } from '@/hooks/booking';
import GeneralSettingsCard from './general-settings-card';
import PaymentSettings from './payment-settings';
import { NoticeBanner } from '@/components/booking';
import { NoticeMessage } from '@/types/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SettingsShimmer = () => {
	return (
        <div className='flex flex-col gap-5 w-full'>
            <Card className="w-full"><CardContent>
                <div className='flex flex-col gap-5'>
                    <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
                    <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                    <div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
                    <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
                    <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
                </div>
            </CardContent></Card>
            <Card className="w-full"><CardContent>
                <div className='flex flex-col gap-5'>
                    <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
                    <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                    <div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
                </div>
            </CardContent></Card>
        </div>
    );
};

/**
 * General Settings Component
 */
const GeneralSettings = () => {
	const { callApi } = useApi();
	const { callApi: saveApi, loading: saveLoading } = useApi();
	const [loading, setLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Function to show notice with auto-hide
	const showNotice = useCallback((noticeData: NoticeMessage) => {
		setNotice(noticeData);
		// Auto hide after 3 seconds
		setTimeout(() => {
			setNotice(null);
		}, 3000);
	}, []);

	// Unified state for all settings
	const [settings, setSettings] = useState({
		general: {
			start_from: 'monday',
			time_format: '',
			auto_cancel_after: 60, // 1 hour default
			auto_complete_after: 120, // 2 hours default
			default_country_code: 'US',
			enable_summary_email: false,
			summary_email_frequency: 'daily',
			include_ics: false,
		},
		payments: {
			currency: 'USD',
		},
		theme: {
			color_scheme: 'system',
		},
	});

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			// Clear any existing timeout when component unmounts
			if (notice) {
				setNotice(null);
			}
		};
	}, []);

	// Fetch settings on component mount
	useEffect(() => {
		const fetchSettings = async () => {
			setLoading(true);
			callApi({
				path: 'settings',
				method: 'GET',
				onSuccess(response) {
					setSettings(response);
					setLoading(false);
				},
				onError(error) {
					showNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message:
							error.message ||
							__('Failed to fetch settings', 'doublescale'),
					});
					setLoading(false);
				},
			});
		};

		fetchSettings();
	}, [showNotice]);

	const handleSave = async () => {
		try {
			await saveApi({
				path: 'settings',
				method: 'POST',
				data: settings,
				onSuccess() {
					showNotice({
						type: 'success',
						title: __('Success', 'doublescale'),
						message: __(
							'Settings saved successfully',
							'doublescale'
						),
					});
				},
				onError(error) {
					showNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message:
							error.message ||
							__('Failed to save settings', 'doublescale'),
					});
				},
			});
		} catch (error: any) {
			showNotice({
				type: 'error',
				title: __('Error', 'doublescale'),
				message:
					error.message ||
					__(
						'An unexpected error occurred while saving settings',
						'doublescale'
					),
			});
			console.error('Error in handleSave:', error);
		}
	};

	// Function to update settings state
	const updateSettings = (section, field, value) => {
		setSettings((prevState) => ({
			...prevState,
			[section]: {
				...prevState[section],
				[field]: value,
			},
		}));
	};

	if (loading) {
		return <SettingsShimmer />;
	}

	return (
        <div className='flex flex-col gap-5'>
            {notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}
            <div className='flex gap-5 flex-col'>
				<GeneralSettingsCard
					settings={settings.general}
					updateSettings={(field, value) =>
						updateSettings('general', field, value)
					}
				/>
				<PaymentSettings
					settings={settings.payments}
					updateSettings={(field, value) =>
						updateSettings('payments', field, value)
					}
				/>
			</div>
            <div className='flex justify-end'>
				<Button
					onClick={handleSave}
					disabled={saveLoading}
					className={`rounded-lg font-medium px-10 text-white ${
						saveLoading
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-primary '
					}`}
					variant='default'
				>
					{__('Save', 'doublescale')}
				</Button>
			</div>
        </div>
    );
};

export default GeneralSettings;
