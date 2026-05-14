/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { PlusSquare as PlusSquareOutlined, Trash2 as DeleteOutlined, ArrowLeft as ArrowLeftOutlined } from 'lucide-react';
import { isEmpty, map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Fields, Integration } from '@/config/booking';
import { useApi } from '@/hooks/booking';
import type { NoticeMessage } from '@/types/booking';
import { ProGlobalIntegrations } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxCard } from '@/components/booking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const getIntegrationRequirements = (
	integrationSlug: string,
	integrationName: string
) => {
	switch (integrationSlug) {
		case 'google':
			return {
				[__('Requirements', 'doublescale')]: [
					__('DoubleScale Pro Account.', 'doublescale'),
					__('A Google account.', 'doublescale'),
					__(
						'Give DoubleScale Full Access to manage Calendar and Conferencing.',
						'doublescale'
					),
				],
			};
		case 'outlook':
			return {
				[__('Requirements', 'doublescale')]: [
					__('DoubleScale Pro Account.', 'doublescale'),
					__('Microsoft account.', 'doublescale'),
					__(
						'Give DoubleScale Full Access to manage Calendar and Conferencing.',
						'doublescale'
					),
				],
			};
		case 'apple':
			return {
				[__('Requirements', 'doublescale')]: [
					__('DoubleScale Pro Account.', 'doublescale'),
					__('Apple account.', 'doublescale'),
					__(
						'Give DoubleScale Full Access to manage Calendar.',
						'doublescale'
					),
				],
			};
		case 'zoom':
			return {
				[__('Features that save you time:', 'doublescale')]: [
					__(
						'Automatically create Zoom meetings at the time an event is scheduled',
						'doublescale'
					),
					__(
						'Instantly share unique conferencing details upon confirmation.',
						'doublescale'
					),
				],
				[__('Requirements', 'doublescale')]: [
					__('DoubleScale Pro Account.', 'doublescale'),
					__('A Zoom account.', 'doublescale'),
					__(
						'Give DoubleScale Full Access to manage Zoom meetings.',
						'doublescale'
					),
				],
			};
		default:
			return {
				[__('Requirements', 'doublescale')]: [
					__('DoubleScale Pro Account.', 'doublescale'),
					__(`A ${integrationName} account.`, 'doublescale'),
					__(
						`Give DoubleScale Full Access to manage ${integrationName}.`,
						'doublescale'
					),
				],
			};
	}
};

interface Props {
	integration: Integration & { id?: string };
	calendarId: string;
	slug: string;
	setNotice: (notice: NoticeMessage) => void;
	onCalendarSelect: (selected: boolean) => void;
	hasAccounts: (hasAccounts: boolean) => void;
	/**
	 * When provided (e.g. host integration dialog), reports whether the shell may
	 * dismiss: false while this integration uses a remote calendar, has at least
	 * one account, and none is selected yet.
	 */
	onCloseReadinessChange?: (canDismiss: boolean) => void;
}

const isOAuthAuthType = (auth: string | undefined) =>
	auth === 'oauth' || auth === 'oauth2';

/**
 * Host calendar integrations that support multiple connected accounts (or OAuth)
 * must use the account-manager layout (remote calendar, per-account settings).
 * Defaults from PHP sometimes ship `has_accounts: false` for OAuth providers; treat OAuth as multi-account regardless.
 */
const computeAccountManagerLayout = (
	integration: Integration & { id?: string },
	slug: string
) =>
	Boolean(integration.has_accounts) ||
	isOAuthAuthType(integration.auth_type) ||
	(integration.id || slug) === 'apple';

/**
 * Server-injected `booking.integrations` must include `fields`; if a slug is
 * missing definitions (stale cache, partial PHP options), Zoom credentials
 * still need to render — see {@see BookingAdminConfig::get_booking_integrations_for_admin()}.
 */
const getZoomCredentialFieldsFallback = (): Fields => ({
	account_id: {
		type: 'text',
		label: __('Account ID', 'doublescale'),
		required: true,
		placeholder: __('Enter your Zoom Account ID', 'doublescale'),
		description: __(
			'You can find your Account ID in your Zoom app settings.',
			'doublescale'
		),
	},
	client_id: {
		type: 'text',
		label: __('Client ID', 'doublescale'),
		required: true,
		placeholder: __('Enter your Zoom Client ID', 'doublescale'),
		description: __(
			'You can find your Client ID in your Zoom app settings.',
			'doublescale'
		),
	},
	client_secret: {
		type: 'text',
		label: __('Secret Key', 'doublescale'),
		required: true,
		placeholder: __('Enter your Zoom Secret Key', 'doublescale'),
		description: __(
			'You can find your Secret Key in your Zoom app settings.',
			'doublescale'
		),
	},
});

function fieldsForIntegrationDetails(
	slug: string,
	fields: Fields | undefined
): Fields {
	if ( fields && Object.keys( fields ).length > 0 ) {
		return fields;
	}
	if ( slug === 'zoom' ) {
		return getZoomCredentialFieldsFallback();
	}
	return fields || {};
}

interface Account {
	id: string;
	name: string;
	config: {
		calendars?: string[];
		email?: string;
		default_calendar?: {
			calendar_id: string;
			account_id: string;
		} | null;
		settings?: {
			enable_notifications?: boolean;
			guests_can_see_others?: boolean;
			enable_teams?: boolean;
			[key: string]: any;
		};
		[key: string]: any;
	};
	calendars: any[];
	app_credentials: any;
}

const IntegrationDetailsPage: React.FC<Props> = ({
	integration,
	calendarId,
	slug,
	setNotice,
	onCalendarSelect,
	hasAccounts,
	onCloseReadinessChange,
}) => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [formValues, setFormValues] = useState<Record<string, any>>({});
	const form = {
		getFieldsValue: () => formValues,
		setFieldsValue: (vals: Record<string, any>) => setFormValues((prev) => ({ ...prev, ...vals })),
		getFieldValue: (key: string) => formValues[key],
		resetFields: () => setFormValues({}),
		validateFields: async () => formValues,
	};
	const { callApi, loading } = useApi();
	const { callApi: connectApi, loading: connectLoading } = useApi();
	const { callApi: toggleCalendarApi } = useApi();
	const { callApi: updateSettingsApi } = useApi();
	const { callApi: deleteApi } = useApi();
	const {
		callApi: appleIntegrationSettingsApi,
		loading: appleIntegrationSettingsLoading,
	} = useApi();
	const [visible, setVisible] = useState(false);
	const [integrationSlug, setIntegrationSlug] = useState(
		integration?.id || slug
	);
	const [selectedCalendar, setSelectedCalendar] = useState<string>('');
	const [isProVersion, setIsProVersion] = useState<boolean>(false);
	const [appleGlobalSettings, setAppleGlobalSettings] = useState<{
		app?: { enabled?: boolean; cache_time?: number };
		[key: string]: unknown;
	} | null>(null);

	const appleIntegrationEnabledChecked =
		appleGlobalSettings === null ||
		appleGlobalSettings?.app?.enabled !== false;

	const appleIntegrationUiLocked =
		integrationSlug === 'apple' &&
		isProVersion &&
		appleGlobalSettings !== null &&
		appleGlobalSettings?.app?.enabled === false;

	const handleAppleGlobalEnabledChange = (checked: boolean) => {
		if (!isProVersion) {
			return;
		}
		const nextSettings = {
			...(appleGlobalSettings || {}),
			app: {
				...(appleGlobalSettings?.app || {}),
				enabled: checked,
			},
		};
		appleIntegrationSettingsApi({
			path: 'integrations/apple',
			method: 'POST',
			data: { settings: nextSettings },
			onSuccess(response: {
				settings?: { app?: { enabled?: boolean } };
			}) {
				setAppleGlobalSettings(response?.settings ?? nextSettings);
				setNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __(
						'Apple Calendar settings saved.',
						'doublescale'
					),
				});
			},
			onError(error: string) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message:
						error ||
						__(
							'Failed to save Apple Calendar settings.',
							'doublescale'
						),
				});
			},
		});
	};

	useEffect(() => {
		if (integrationSlug !== 'apple' || !isProVersion) {
			setAppleGlobalSettings(null);
			return;
		}
		appleIntegrationSettingsApi({
			path: 'integrations/apple',
			method: 'GET',
			onSuccess(response: {
				settings?: {
					app?: { enabled?: boolean; cache_time?: number };
				};
			}) {
				setAppleGlobalSettings(response?.settings ?? {});
			},
			onError() {
				setAppleGlobalSettings({});
			},
		});
	}, [integrationSlug, isProVersion]);

	useEffect(() => {
		if (isProVersion) {
			fetchAccounts();
		}
	}, [integrationSlug, calendarId, isProVersion]);

	useEffect(() => {
		setIntegrationSlug(integration?.id || slug);
	}, [integration?.id, slug]);

	useEffect(() => {
		setIsProVersion(
			Boolean(applyFilters('doublescale_is_pro_active', false))
		);
	}, []);

	// Update selected calendar when accounts change
	useEffect(() => {
		hasAccounts(accounts.length > 0);
		if (!accounts.length) {
			setSelectedCalendar('');
			return;
		}

		// Find the first account with a default calendar
		for (const account of accounts) {
			if (account.config?.default_calendar?.calendar_id) {
				setSelectedCalendar(
					account.config.default_calendar.calendar_id
				);
				break;
			}
		}
	}, [accounts]);

	useEffect(() => {
		if (integrationSlug == 'zoom') {
			onCalendarSelect(true);
		} else {
			onCalendarSelect(Boolean(selectedCalendar));
		}
	}, [selectedCalendar]);

	const fetchAccounts = () => {
		callApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts`,
			method: 'GET',
			onSuccess(response) {
				const accounts = map(response, (account, id) => ({
					...account,
					id,
				})) as Account[];

				let nextSelected = '';
				for (const account of accounts) {
					if (account.config?.default_calendar?.calendar_id) {
						nextSelected = account.config.default_calendar.calendar_id;
						break;
					}
				}

				setAccounts(accounts);
				setSelectedCalendar(nextSelected);

				// Set form values from first account's app_credentials if available
				if (accounts.length > 0 && accounts[0].app_credentials) {
					const formValues = { ...accounts[0].app_credentials };

					// Add integration-specific settings to form values
					if (accounts[0].config?.settings) {
						// For Google Calendar
						if (integrationSlug === 'google') {
							formValues.enable_notifications =
								accounts[0].config.settings
									.enable_notifications || false;
							formValues.guests_can_see_others =
								accounts[0].config.settings
									.guests_can_see_others || false;
						}

						// For Outlook
						if (integrationSlug === 'outlook') {
							formValues.enable_teams =
								accounts[0].config.settings.enable_teams ||
								false;
						}
					}

					form.setFieldsValue(formValues);
				}
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: error.message,
				});
			},
		});
	};

	const handleCheckTeamsCapabilities = async (
		account: any,
		type: string,
		checked: boolean
	) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		try {
			callApi({
				path: `integrations/${integrationSlug}/${calendarId}/accounts/${account.id}/check-teams`,
				method: 'GET',
				onSuccess(response: any) {
					if (response.success) {
						// User has Teams capability, proceed with enabling Teams
						handleSettingsChange(
							account.id,
							type,
							checked
						);
					} else {
						// User doesn't have Teams capability
						setNotice({
							type: 'error',
							title: __('Error', 'doublescale'),
							message:
								response.message ||
								__(
									'Failed to verify Teams capabilities',
									'doublescale'
								),
						});
					}
				},
				onError(error: any) {
					console.error('Error checking Teams capabilities:', error);
					setNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message: __(
							'Failed to verify Teams capabilities. Please try again later.',
							'doublescale'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error checking Teams capabilities:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'Failed to verify Teams capabilities. Please try again later.',
					'doublescale'
				),
			});
		}
	};

	const handleDeleteAccount = async (accountId: string) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		try {
			await deleteApi({
				path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
				method: 'DELETE',
				onSuccess() {
					setNotice({
						type: 'success',
						title: __('Success', 'doublescale'),
						message: __('Account deleted', 'doublescale'),
					});
					setAccounts((prev) =>
						prev.filter((account) => account.id !== accountId)
					);
					// Clear form fields after successful deletion
					form.resetFields();
					// Reset selected calendar
					setSelectedCalendar('');
				},
				onError(error) {
					setNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message:
							error?.message ||
							__('Failed to delete account', 'doublescale'),
					});
				},
			});
		} catch (err) {
			console.error('Error in delete account:', err);
			setNotice({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'An unexpected error occurred while deleting the account',
					'doublescale'
				),
			});
		}
	};

	const handleConnectOAuth = () => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		connectApi({
			path: addQueryArgs(`integrations/${integrationSlug}/auth`, {
				host_id: calendarId,
			}),
			method: 'GET',
			onSuccess(response: { auth_uri?: unknown }) {
				const authUri = response?.auth_uri;
				if (typeof authUri !== 'string' || !authUri.trim()) {
					setNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message: __(
							'Could not start sign-in (invalid authorization URL). Check your connection or OAuth settings.',
							'doublescale'
						),
					});
					return;
				}
				window.location.href = authUri;
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: error.message,
				});
			},
		});
	};

	const handleConnectBasic = () => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		form.validateFields()
			.then((values) => {
				// Extract integration-specific settings from form values
				const appCredentials = { ...values };
				const settings = {};

				// Handle Google Calendar specific settings
				if (integrationSlug === 'google') {
					// Remove these settings from credentials and move to config.settings
					if ('enable_notifications' in appCredentials) {
						settings['enable_notifications'] =
							appCredentials.enable_notifications;
						delete appCredentials.enable_notifications;
					}
					if ('guests_can_see_others' in appCredentials) {
						settings['guests_can_see_others'] =
							appCredentials.guests_can_see_others;
						delete appCredentials.guests_can_see_others;
					}
				}

				// Handle Outlook specific settings
				if (integrationSlug === 'outlook') {
					if ('enable_teams' in appCredentials) {
						settings['enable_teams'] = appCredentials.enable_teams;
						delete appCredentials.enable_teams;
					}
				}

				connectApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts`,
					method: 'POST',
					data: {
						app_credentials: appCredentials,
						config: {
							settings:
								Object.keys(settings).length > 0
									? settings
									: undefined,
						},
					},
					onSuccess() {
						fetchAccounts();
						setNotice({
							type: 'success',
							title: __('Success', 'doublescale'),
							message: __('Account connected', 'doublescale'),
						});
					},
					onError(error) {
						setNotice({
							type: 'error',
							title: __('Error', 'doublescale'),
							message: error.message,
						});
					},
				});
			})
			.catch(() => {
				// Ant Design's validateFields rejects with field-level errors
				// it has already surfaced inline. Nothing more to do here.
			});
	};

	const handleCalendarSelection = (
		accountId: string,
		calId: string,
		checked: boolean
	) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		const newAccounts = accounts.map((account) => {
			if (account.id === accountId) {
				// Initialize calendars array if it doesn't exist
				const currentCalendars = Array.isArray(
					account.config?.calendars
				)
					? account.config.calendars
					: [];

				return {
					...account,
					config: {
						...account.config,
						calendars: checked
							? [...currentCalendars, calId]
							: currentCalendars.filter((id) => id !== calId),
					},
				};
			}

			return account;
		});

		toggleCalendarApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
			method: 'PUT',
			data: {
				config: {
					calendars:
						newAccounts.find((account) => account.id === accountId)
							?.config?.calendars || [],
				},
			},
			onSuccess() {
				setAccounts(newAccounts);
				setNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __('Calendar selection updated', 'doublescale'),
				});
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: error.message,
				});
			},
		});
	};

	const accountManagerLayout = computeAccountManagerLayout(
		integration,
		slug
	);

	useEffect(() => {
		if (!onCloseReadinessChange) {
			return;
		}
		const needsRemoteCalendar =
			accountManagerLayout && integrationSlug !== 'zoom';
		const canDismiss =
			!needsRemoteCalendar ||
			accounts.length === 0 ||
			Boolean(selectedCalendar);
		onCloseReadinessChange(canDismiss);
	}, [
		onCloseReadinessChange,
		accountManagerLayout,
		integrationSlug,
		accounts.length,
		selectedCalendar,
	]);

	const canAddAccount = () => accountManagerLayout && visible == false;

	const handleRemoteCalendarChange = (value: string) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		// Find which account this calendar belongs to
		let foundAccount: Account | undefined = undefined;
		let foundCalendar: any = null;

		for (const account of accounts) {
			if (!account.calendars) continue;

			const calendar = account.calendars.find((cal) => cal.id === value);
			if (calendar) {
				foundAccount = account;
				foundCalendar = calendar;
				break;
			}
		}

		if (!foundAccount || !foundCalendar) return;

		const foundId = String(foundAccount.id);

		// Update local state first for immediate feedback
		setSelectedCalendar(value);
		onCalendarSelect(true);

		// Update all accounts — only one keeps the default calendar (normalize ids as strings)
		const updatedAccounts = accounts.map((account) => {
			if (String(account.id) === foundId) {
				return {
					...account,
					config: {
						...account.config,
						default_calendar: {
							calendar_id: value,
							account_id: String(account.id),
						},
					},
				};
			}
			return {
				...account,
				config: {
					...account.config,
					default_calendar: null,
				},
			};
		});

		setAccounts(updatedAccounts);

		const putAccountConfig = (account: Account) =>
			new Promise<void>((resolve, reject) => {
				toggleCalendarApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts/${account.id}`,
					method: 'PUT',
					data: {
						config: account.config,
					},
					onSuccess() {
						resolve();
					},
					onError(message: string) {
						reject(new Error(message));
					},
				});
			});

		Promise.all(updatedAccounts.map((account) => putAccountConfig(account)))
			.then(() => {
				setNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __(
						'Default calendar updated successfully',
						'doublescale'
					),
				});
			})
			.catch((error: Error) => {
				setSelectedCalendar('');
				setAccounts(accounts);
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message:
						error?.message ||
						__('Failed to update default calendar', 'doublescale'),
				});
			});
	};

	// Get all available calendars across all accounts
	const getAllCalendars = () => {
		const options: { value: string; label: string; can_edit: boolean }[] =
			[];
		const seenCalendars = new Set<string>();

		for (const account of accounts) {
			if (!account.calendars || !account.calendars.length) continue;

			for (const calendar of account.calendars) {
				// Skip if we've already seen this calendar
				if (seenCalendars.has(calendar.id)) continue;
				seenCalendars.add(calendar.id);

				options.push({
					value: calendar.id,
					label: `${calendar.name} (${account.name})${!calendar.can_edit ? ' (Read Only)' : ''}`,
					can_edit: calendar.can_edit,
				});
			}
		}
		return options;
	};

	const handleSettingsChange = (
		accountId: string,
		setting: string,
		checked: boolean
	) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'doublescale'),
				message: __(
					'This feature requires the Pro version of DoubleScale.',
					'doublescale'
				),
			});
			return;
		}

		const newAccounts = accounts.map((account) => {
			if (account.id === accountId) {
				return {
					...account,
					config: {
						...account.config,
						settings: {
							...account.config?.settings,
							[setting]: checked,
						},
					},
				};
			}
			return account;
		});

		updateSettingsApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
			method: 'PUT',
			data: {
				config: {
					...newAccounts.find((account) => account.id === accountId)
						?.config,
					settings: {
						...newAccounts.find(
							(account) => account.id === accountId
						)?.config?.settings,
						[setting]: checked,
					},
				},
			},
			onSuccess() {
				setAccounts(newAccounts);
				setNotice({
					type: 'success',
					title: __('Success', 'doublescale'),
					message: __(
						'Settings updated successfully',
						'doublescale'
					),
				});
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message:
						error.message ||
						__('Failed to update settings', 'doublescale'),
				});
			},
		});
	};

	const renderAccountList = () => (
		<div className='flex flex-col gap-5 w-full'>
			<div className='flex flex-col gap-5'>
				{loading ? (
					<Spinner />
				) : (
					accounts.map((account) => (
						<Card key={account.id}><CardContent>
                                <div
                                    className='flex items-center gap-4 p-0 text-color-primary-text border-b pb-5 mb-5'>
                                    <img
                                        src={integration.icon}
                                        alt={integration.name}
                                        className="size-8"
                                    />
                                    <div className='flex justify-between items-center'>
                                        <div>
                                            <span className="text-[#09090B] font-bold text-2xl block">
                                                {account.name}
                                                <span className="text-[#0EA473] text-xs font-medium italic ml-3">
                                                    {__(
                                                        'Connected',
                                                        'doublescale'
                                                    )}
                                                </span>
                                            </span>
                                            <span className="text-[#3F4254] italic font-medium">
                                                {account.config.email}
                                            </span>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    title={__(
                                                        'Delete Account',
                                                        'doublescale'
                                                    )}
                                                    variant="destructive"
                                                    size="icon"
                                                >
                                                    <DeleteOutlined className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {__('Are you sure you want to delete this account?', 'doublescale')}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription />
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{__('No', 'doublescale')}</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteAccount(account.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {__('Yes', 'doublescale')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                {integration.is_calendar && (
                                    <div className='flex flex-col gap-2.5 w-full border-b pb-4 mb-4'>
                                        <span className="text-[#9197A4]">
                                            {__(
                                                'Enable the calendars you want to check for conflicts to prevent double bookings.',
                                                'doublescale'
                                            )}
                                        </span>
                                        {!isEmpty(account.calendars) ? (
                                            <div className='flex flex-col gap-2'>
                                                {account.calendars.map(
                                                    (calendar) => (
                                                        <CheckboxCard
                                                            key={calendar.id}
                                                            checked={
                                                                !isEmpty(
                                                                    account.config
                                                                ) &&
                                                                Array.isArray(
                                                                    account.config
                                                                        .calendars
                                                                )
                                                                    ? account.config.calendars.includes(
                                                                            calendar.id
                                                                        )
                                                                    : false
                                                            }
                                                            onCheckedChange={(checked) =>
                                                                handleCalendarSelection(
                                                                    account.id,
                                                                    calendar.id,
                                                                    checked
                                                                )
                                                            }
                                                            className="text-color-primary-text font-semibold"
                                                        >
                                                            {calendar.name}
                                                        </CheckboxCard>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <span>
                                                {__(
                                                    'No calendars found.',
                                                    'doublescale'
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Additional integration-specific settings for existing accounts */}
                                {integrationSlug === 'google' && (
                                    <div className='flex flex-col gap-2.5 w-full border-b pb-4 mb-4'>
                                        <span className="text-[#9197A4] font-semibold">
                                            {__(
                                                'Google Calendar Settings',
                                                'doublescale'
                                            )}
                                        </span>
                                        <div className='flex flex-col gap-2'>
                                            <CheckboxCard
                                                checked={
                                                    account.config?.settings
                                                        ?.enable_notifications ===
                                                    true
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleSettingsChange(
                                                        account.id,
                                                        'enable_notifications',
                                                        checked
                                                    )
                                                }
                                                className="text-color-primary-text font-semibold"
                                            >
                                                {__(
                                                    'Enable Google Calendar Notifications',
                                                    'doublescale'
                                                )}
                                            </CheckboxCard>
                                            <CheckboxCard
                                                checked={
                                                    account.config?.settings
                                                        ?.guests_can_see_others ===
                                                    true
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleSettingsChange(
                                                        account.id,
                                                        'guests_can_see_others',
                                                        checked
                                                    )
                                                }
                                                className="text-color-primary-text font-semibold"
                                            >
                                                {__(
                                                    'Guests can see other guests of the slot',
                                                    'doublescale'
                                                )}
                                            </CheckboxCard>
                                        </div>
                                    </div>
                                )}
                                {integrationSlug === 'outlook' && (
                                    <div className='flex flex-col gap-2.5 w-full border-b pb-4 mb-4'>
                                        <span className="text-[#9197A4] font-semibold">
                                            {__(
                                                'Microsoft Settings',
                                                'doublescale'
                                            )}
                                        </span>
                                        <div className='flex flex-col gap-2'>
                                            <CheckboxCard
                                                checked={
                                                    account.config?.settings
                                                        ?.enable_teams === true
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleCheckTeamsCapabilities(
                                                        account,
                                                        'enable_teams',
                                                        checked
                                                    )
                                                }
                                                className="text-color-primary-text font-semibold"
                                            >
                                                {__(
                                                    'Enable Microsoft Teams (Requires work/school account)',
                                                    'doublescale'
                                                )}
                                            </CheckboxCard>
                                        </div>
                                    </div>
                                )}
                            </CardContent></Card>
					))
				)}
			</div>
		</div>
	);

	return (
        <Card className="integration-details-page h-fit"><CardContent>
                    <div
                        className='flex items-center gap-4 p-0 text-color-primary-text border-b pb-5 mb-5'>
                        <img
                            src={integration.icon}
                            alt={integration.name}
                            className="size-12"
                        />
                        <div className='flex justify-between items-center'>
                            <div>
                                <span className="text-[#09090B] font-bold text-2xl block">
                                    {integration.name}
                                </span>
                                <span className="text-sm">
                                    {integration.description}
                                </span>
                            </div>
                            {canAddAccount() && (
                                <Button
                                    onClick={() =>
                                        isOAuthAuthType(integration.auth_type)
                                            ? handleConnectOAuth()
                                            : setVisible(true)
                                    }
                                    disabled={
                                        connectLoading ||
                                        (integrationSlug === 'apple' &&
                                            isProVersion &&
                                            appleIntegrationUiLocked)
                                    }
                                    className="border-none shadow-none text-primary text-base font-medium inline-flex items-center gap-2"
                                >
                                    {connectLoading ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        <PlusSquareOutlined className="h-4 w-4" />
                                    )}
                                    {__('Add New', 'doublescale')}
                                </Button>
                            )}
                        </div>
                    </div>
                    {integrationSlug === 'apple' && isProVersion ? (
                        <div className="flex flex-col gap-4 border-b border-border pb-5 mb-5">
                            <p className="text-[#3F4254] text-base">
                                {__(
                                    'To use Apple Calendar Integration for your Booking forms, please enable the integration.',
                                    'doublescale'
                                )}{' '}
                                <a
                                    href={
                                        (applyFilters(
                                            'doublescale_booking_apple_documentation_url',
                                            '#'
                                        ) as string) || '#'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-primary underline"
                                >
                                    {__('Read the documentation', 'doublescale')}
                                </a>
                            </p>
                            <div className="flex flex-col gap-2">
                                <span className="text-[#09090B] font-bold text-base">
                                    {__('Status', 'doublescale')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        className="custom-checkbox"
                                        checked={appleIntegrationEnabledChecked}
                                        disabled={
                                            appleGlobalSettings === null ||
                                            appleIntegrationSettingsLoading
                                        }
                                        onCheckedChange={(checked) =>
                                            handleAppleGlobalEnabledChange(
                                                Boolean(checked)
                                            )
                                        }
                                    />
                                    <span className="text-color-primary-text font-semibold">
                                        {__(
                                            'Enable Apple Calendar Integration',
                                            'doublescale'
                                        )}
                                    </span>
                                    {appleIntegrationSettingsLoading ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : null}
                    {!accountManagerLayout ? (
                        isProVersion ? (
                            <>
                                <div className="zoom-fields">
                                    <div className='flex flex-col gap-2.5 w-full'>
                                        <div className="text-[#71717A] italic">
                                            {__('Please read the', 'doublescale')}
                                            {' '}
                                            <span className="cursor-pointer font-semibold underline mx-1">
                                                {__(
                                                    'documentation here',
                                                    'doublescale'
                                                )}
                                            </span>{' '}
                                            {__(
                                                'for step by step guide to know how you can get credentials from Zoom Account',
                                                'doublescale'
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {map(
                                                fieldsForIntegrationDetails(
                                                    integrationSlug,
                                                    integration.fields
                                                ),
                                                (field, fieldKey) => (
                                                    <div key={fieldKey} className="space-y-1">
                                                        <label
                                                            htmlFor={`${integrationSlug}-${fieldKey}`}
                                                            className="text-[#3F4254] font-semibold text-[16px]"
                                                        >
                                                            {field.label}
                                                        </label>
                                                        {field.type === 'password' ||
                                                        fieldKey === 'client_secret' ? (
                                                            <div className='flex gap-2.5'>
                                                                <Input
                                                                    id={`${integrationSlug}-${fieldKey}`}
                                                                    placeholder={field.placeholder}
                                                                    className="rounded-lg h-[48px]"
                                                                    type='password'
                                                                    value={formValues[fieldKey] || ''}
                                                                    onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
                                                                    required={field.required}
                                                                />
                                                                {accounts.length > 0 && (
                                                                    <Button
                                                                        className="h-[48px]"
                                                                        onClick={() => handleDeleteAccount(accounts[0].id)}
                                                                        disabled={loading}
                                                                        variant='destructive'
                                                                    >
                                                                        {__('Disconnect', 'doublescale')}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                id={`${integrationSlug}-${fieldKey}`}
                                                                type={field.type}
                                                                placeholder={field.placeholder}
                                                                className="rounded-lg h-[48px]"
                                                                value={formValues[fieldKey] || ''}
                                                                onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
                                                                required={field.required}
                                                            />
                                                        )}
                                                        <span className="text-xs">
                                                            {field.description ||
                                                                `You Can Find Your ${field.label.replace('*', '')} In Your ${integration.name} App Settings.`}
                                                        </span>
                                                    </div>
                                                )
                                            )}

                                            {integrationSlug === 'google' && (
                                                <>
                                                    <hr className='border-t border-border my-4' />
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Checkbox
                                                            className="custom-checkbox"
                                                            checked={formValues.enable_notifications || false}
                                                            onCheckedChange={(checked) => form.setFieldsValue({ enable_notifications: Boolean(checked) })}
                                                        />
                                                        <span className="text-color-primary-text font-semibold">
                                                            {__('Enable Google Calendar Notifications', 'doublescale')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            className="custom-checkbox"
                                                            checked={formValues.guests_can_see_others || false}
                                                            onCheckedChange={(checked) => form.setFieldsValue({ guests_can_see_others: Boolean(checked) })}
                                                        />
                                                        <span className="text-color-primary-text font-semibold">
                                                            {__('Guests can see other guests of the slot', 'doublescale')}
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            {integrationSlug === 'outlook' && (
                                                <>
                                                    <hr className='border-t border-border my-4' />
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            className="custom-checkbox"
                                                            checked={formValues.enable_teams || false}
                                                            onCheckedChange={(checked) => form.setFieldsValue({ enable_teams: Boolean(checked) })}
                                                        />
                                                        <span className="text-color-primary-text font-semibold">
                                                            {__('Enable Microsoft Teams (Requires work/school account)', 'doublescale')}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <hr className='border-t border-border my-4' />

                                        <div className="text-[#71717A] italic">
                                            {__(
                                                'The above credentials will be encrypted and stored securely.',
                                                'doublescale'
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => {
                                                handleConnectBasic();
                                                setVisible(false);
                                            }}
                                            disabled={connectLoading}
                                            style={{ marginTop: '10px' }}
                                            variant='default'
                                            className="inline-flex items-center gap-2"
                                        >
                                            {connectLoading ? (
                                                <Spinner className="h-4 w-4" />
                                            ) : null}
                                            {connectLoading
                                                ? __(
                                                        'Saving & Validating...',
                                                        'doublescale'
                                                    )
                                                : __(
                                                        'Save & Validate Credentials',
                                                        'doublescale'
                                                    )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <ProGlobalIntegrations
                                list={getIntegrationRequirements(
                                    integrationSlug,
                                    integration.name
                                )}
                            />
                        )
                    ) : (
                        <div
                            className={
                                appleIntegrationUiLocked
                                    ? 'pointer-events-none opacity-50 select-none'
                                    : undefined
                            }
                        >
                            <>
                            {visible ? (
                                <div className='flex flex-col gap-2.5 w-full'>
                                    {/* add back button */}
                                    <div className='flex justify-between items-center'>
                                        <Button
                                            onClick={() => setVisible(false)}
                                            className="text-[#3F4254] font-semibold mb-2"
                                            variant='link'>{<ArrowLeftOutlined />} 
                                            {__('Back', 'doublescale')}
                                        </Button>
                                    </div>
                                    {integrationSlug === 'apple' && (
                                        <div className="text-[#71717A] italic">
                                            {__(
                                                'To connect to Apple Server, please enter your Apple Email and app specific password. Generate App Specific Password at',
                                                'doublescale'
                                            )}
                                            <span className="cursor-pointer font-semibold underline mx-1">
                                                {__(
                                                    'https://appleid.apple.com/account/manage',
                                                    'doublescale'
                                                )}
                                            </span>
                                            {__(
                                                'Your credentials will be stored as encrypted.',
                                                'doublescale'
                                            )}
                                        </div>
                                    )}
                                    {integrationSlug === 'zoom' && (
                                        <div className="text-[#71717A] italic">
                                            {__('Please read the', 'doublescale')}
                                            {' '}
                                            <span className="cursor-pointer font-semibold underline mx-1">
                                                {__('documentation here', 'doublescale')}
                                            </span>{' '}
                                            {__(
                                                'for a step-by-step guide on creating a Server-to-Server OAuth app in the Zoom Marketplace.',
                                                'doublescale'
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {map(
                                            fieldsForIntegrationDetails(
                                                integrationSlug,
                                                integration.fields
                                            ),
                                            (field, fieldKey) => (
                                            <div key={fieldKey} className="space-y-1">
                                                <label
                                                    htmlFor={`${integrationSlug}-${fieldKey}`}
                                                    className="text-[#3F4254] font-semibold text-[16px]"
                                                >
                                                    {field.label}
                                                </label>
                                                {field.type === 'password' ||
                                                fieldKey === 'client_secret' ? (
                                                    <div className='flex gap-2.5'>
                                                        <Input
                                                            id={`${integrationSlug}-${fieldKey}`}
                                                            placeholder={field.placeholder}
                                                            className="rounded-lg h-[48px]"
                                                            type='password'
                                                            value={formValues[fieldKey] || ''}
                                                            onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
                                                            required={field.required}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Input
                                                        id={`${integrationSlug}-${fieldKey}`}
                                                        type={
                                                            field.type === 'swtich' ||
                                                            field.type === 'checkbox'
                                                                ? 'text'
                                                                : field.type
                                                        }
                                                        placeholder={field.placeholder}
                                                        className="rounded-lg h-[48px]"
                                                        value={formValues[fieldKey] || ''}
                                                        onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
                                                        required={field.required}
                                                    />
                                                )}
                                                <span className="text-xs">
                                                    {field.description ||
                                                        `You Can Find Your ${field.label.replace('*', '')} In Your ${integration.name} App Settings.`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => {
                                                form.validateFields()
                                                    .then(() => {
                                                        handleConnectBasic();
                                                        setVisible(false);
                                                    })
                                                    .catch(() => {
                                                        // Ant Design surfaces field errors inline.
                                                    });
                                            }}
                                            disabled={connectLoading}
                                            style={{ marginTop: '10px' }}
                                            variant='default'
                                            className="inline-flex items-center gap-2"
                                        >
                                            {connectLoading ? (
                                                <Spinner className="h-4 w-4" />
                                            ) : null}
                                            {connectLoading
                                                ? __('Connecting...', 'doublescale')
                                                : integrationSlug === 'apple'
                                                    ? __(
                                                            'Connect with Apple Calendar',
                                                            'doublescale'
                                                        )
                                                    : integrationSlug === 'zoom'
                                                        ? __(
                                                                'Save & Validate Credentials',
                                                                'doublescale'
                                                            )
                                                        : __(
                                                                'Connect account',
                                                                'doublescale'
                                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex flex-col gap-5 w-full'>
                                    <div className='flex flex-col'>
                                        <div className="text-[#3F4254] font-semibold text-[16px]">
                                            {__('Remote Calendar', 'doublescale')}
                                            <span className="text-[#E53E3E]">
                                                {__('*', 'doublescale')}
                                            </span>
                                        </div>
                                        <Select
                                            key={`remote-cal-${integrationSlug}-${calendarId}-${selectedCalendar || 'none'}`}
                                            value={selectedCalendar || undefined}
                                            onValueChange={handleRemoteCalendarChange}
                                            disabled={
                                                loading ||
                                                !accounts.length ||
                                                appleIntegrationUiLocked
                                            }
                                        >
                                            <SelectTrigger className="w-full rounded-lg h-12">
                                                <SelectValue
                                                    placeholder={__(
                                                        'Select a Remote Calendar',
                                                        'doublescale'
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAllCalendars().map((c) => (
                                                    <SelectItem
                                                        key={c.value}
                                                        value={c.value}
                                                        disabled={!c.can_edit}
                                                    >
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="text-[#71717A] italic">
                                            {__(
                                                'Choose which remote calendar new events are added to when this host is booked.',
                                                'doublescale'
                                            )}
                                        </div>
                                    </div>
                                    {renderAccountList()}
                                </div>
                            )}
                            </>
                        </div>
                    )}
                </CardContent></Card>
    );
};

export default IntegrationDetailsPage;
