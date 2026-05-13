/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useApi from '../api';

/**
 * Hook to fetch and use global settings
 */
const useGlobalSettings = () => {
	const { callApi } = useApi();
	const [loading, setLoading] = useState(true);
	const [settings, setSettings] = useState({
		general: {
			start_from: 'monday',
			time_format: '',
			auto_cancel_after: 60,
			auto_complete_after: 120,
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

	const fetchSettings = async () => {
		setLoading(true);
		callApi({
			path: 'settings',
			method: 'GET',
			onSuccess(response) {
				setSettings(response);
				setLoading(false);
			},
			onError() {
				// If there's an error, we'll just use the default settings
				setLoading(false);
			},
		});
	};

	// Fetch settings on mount
	useEffect(() => {
		fetchSettings();
	}, []);

	return {
		settings,
		loading,
		refreshSettings: fetchSettings,
	};
};

export default useGlobalSettings;
