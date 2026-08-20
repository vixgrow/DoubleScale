/**
 * Notification Retention Settings
 *
 * Configures how long notifications are stored before automatic cleanup.
 * This is an admin-only setting that affects all users.
 * Loads its own settings, but is saved through the parent's shared save button.
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

import {
	useState,
	useRef,
	useEffect,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/components/ui/radio-group';
import { Label } from '@doublescale/components/ui/label';
import { Loader2 } from 'lucide-react';

function IconDatabase({ size = 20 }: { size?: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 37 37"
			fill="none"
		>
			<path
				d="M17.7772 31.9856C17.2551 31.9312 16.7322 31.8869 16.2122 31.8211C13.9063 31.5278 11.6762 30.9907 9.67856 29.7361C9.06203 29.3492 8.51201 28.8836 8.10075 28.2728C7.84255 27.8894 7.64586 27.4724 7.63799 27.009C7.6194 25.9318 7.63227 24.8547 7.63227 23.7518C7.67304 23.7718 7.70665 23.7797 7.72668 23.7997C8.73373 24.8561 9.98182 25.5284 11.3222 26.047C13.249 26.7922 15.2553 27.1627 17.3101 27.2929C20.0717 27.4674 22.796 27.2607 25.4588 26.4725C26.9808 26.0219 28.4227 25.399 29.6658 24.384C29.9054 24.1881 30.1257 23.9685 30.3825 23.7339C30.3904 23.8383 30.4004 23.9134 30.4004 23.9878C30.4018 24.791 30.3682 25.5956 30.409 26.3967C30.4676 27.5633 29.9605 28.4401 29.1101 29.1654C28.0251 30.0895 26.7462 30.6452 25.4052 31.0679C23.8274 31.5657 22.2066 31.8411 20.5544 31.9355C20.4493 31.9412 20.3449 31.9691 20.2404 31.9863H17.7779L17.7772 31.9856ZM12.2656 28.4702C12.2699 28.1719 12.0238 27.918 11.7327 27.9209C11.4559 27.923 11.2077 28.1755 11.2077 28.4552C11.2077 28.7362 11.4509 28.983 11.7327 28.9873C12.0188 28.9916 12.2613 28.757 12.2649 28.4702H12.2656ZM9.95106 27.3036C9.95965 27.0204 9.7272 26.7779 9.43681 26.7679C9.14499 26.7579 8.9011 26.9789 8.88822 27.265C8.87463 27.5654 9.10852 27.8114 9.41106 27.8143C9.70073 27.8172 9.94177 27.589 9.95035 27.3036H9.95106Z"
				fill="#0D9DFC"
			/>
			<path
				opacity="0.4"
				d="M19.4363 14.912C16.5446 14.8799 14.1235 14.5873 11.7968 13.7269C10.6017 13.2849 9.47589 12.7191 8.56968 11.7929C8.11909 11.3323 7.77935 10.8044 7.66491 10.1586C7.51114 9.29387 7.8144 8.5629 8.35654 7.91347C9.05891 7.07163 9.97727 6.52662 10.9586 6.08389C12.487 5.39512 14.1013 5.01175 15.7585 4.78574C17.061 4.60836 18.3677 4.54041 19.6794 4.58047C22.2614 4.65843 24.7834 5.04895 27.1572 6.13038C28.1049 6.56167 28.9825 7.1031 29.6627 7.91418C30.6483 9.08931 30.6361 10.4375 29.6269 11.5969C28.7844 12.5646 27.6872 13.1497 26.52 13.6153C24.9729 14.2319 23.3593 14.5873 21.7043 14.7454C20.8088 14.8312 19.9097 14.8784 19.437 14.9128L19.4363 14.912Z"
				fill="#0D9DFC"
			/>
			<path
				opacity="0.4"
				d="M30.3948 18.0439C30.3948 19.1239 30.4149 20.1667 30.3884 21.2088C30.3676 22.0221 29.9435 22.6608 29.382 23.2129C28.5266 24.0526 27.4867 24.5933 26.3838 25.0232C24.8146 25.6354 23.1831 25.978 21.5109 26.1561C18.7172 26.4537 15.9578 26.282 13.2428 25.5517C11.7465 25.1498 10.3153 24.5869 9.08509 23.612C8.44638 23.1063 7.91067 22.5148 7.70397 21.6959C7.6539 21.4992 7.62243 21.2918 7.621 21.0894C7.61242 20.126 7.61671 19.1625 7.61743 18.1991C7.61743 18.1569 7.62315 18.1147 7.62815 18.0425C7.94214 18.3164 8.22109 18.5861 8.52578 18.8221C9.85898 19.8527 11.391 20.4657 13.0003 20.8984C15.4128 21.5471 17.8718 21.7495 20.3636 21.6165C22.465 21.5042 24.5206 21.1588 26.4996 20.4249C27.9158 19.8999 29.234 19.2097 30.2961 18.1018C30.3126 18.0847 30.339 18.0761 30.3955 18.0432L30.3948 18.0439ZM9.94695 21.4899C9.95196 21.2017 9.71879 20.9599 9.42983 20.9521C9.13873 20.9442 8.89698 21.1731 8.8884 21.4635C8.88053 21.7531 9.11227 21.9934 9.40409 21.9992C9.70162 22.0049 9.94266 21.7796 9.94695 21.4906V21.4899ZM11.7393 23.16C12.0383 23.1614 12.2643 22.939 12.2665 22.6429C12.2686 22.3489 12.0412 22.1208 11.7443 22.1193C11.4432 22.1172 11.2172 22.3382 11.2158 22.6364C11.2143 22.9325 11.4411 23.1593 11.7386 23.16H11.7393Z"
				fill="#0D9DFC"
			/>
			<path
				d="M30.3885 12.4157C30.3885 13.4528 30.4099 14.5213 30.3806 15.5885C30.362 16.2672 30.0194 16.8287 29.5703 17.32C28.7127 18.2563 27.622 18.8356 26.4626 19.2962C24.6094 20.0322 22.6747 20.397 20.692 20.5322C18.3561 20.6917 16.0437 20.5479 13.765 19.99C12.0763 19.5766 10.4549 18.9987 9.06946 17.9022C8.43791 17.4023 7.91435 16.8136 7.70479 16.0061C7.67117 15.8774 7.63613 15.7444 7.63541 15.6128C7.62969 14.5356 7.63255 13.4592 7.63255 12.3706C7.66259 12.3778 7.69335 12.3763 7.70694 12.3906C8.7662 13.5 10.0844 14.1902 11.4984 14.7209C13.0826 15.3152 14.7263 15.65 16.4063 15.8252C18.3303 16.0255 20.2529 16.0133 22.1697 15.7623C24.4642 15.4619 26.6857 14.9075 28.6805 13.6795C29.282 13.309 29.8227 12.8391 30.3899 12.4164L30.3885 12.4157ZM9.9492 15.6607C9.94634 15.381 9.69887 15.1328 9.42064 15.13C9.13169 15.1271 8.87921 15.3889 8.8885 15.6807C8.8978 15.9661 9.14241 16.1985 9.42779 16.1928C9.71103 16.1871 9.95278 15.9403 9.94991 15.6607H9.9492ZM11.733 16.2965C11.4498 16.2987 11.2166 16.5447 11.2237 16.8358C11.2309 17.1291 11.4691 17.3637 11.7545 17.3587C12.0348 17.3537 12.2701 17.104 12.2658 16.8158C12.2616 16.5283 12.0212 16.2944 11.733 16.2965Z"
				fill="#0D9DFC"
			/>
		</svg>
	);
}

interface NotificationSettings {
	retention_type: 'days' | 'never' | null;
	retention_days: string | null;
}

export interface NotificationRetentionHandle {
	/** Persists the retention settings. Resolves once the request completes. */
	save: () => Promise<void>;
}

const NotificationRetentionSettings = forwardRef<
	NotificationRetentionHandle,
	{
		/**
		 * Notifies the parent when the section becomes dirty so the shared
		 * "Save Changes" button can appear. Retention has no save button of its
		 * own — it is saved through the parent's single button.
		 */
		onDirtyChange?: (dirty: boolean) => void;
	}
>(({ onDirtyChange }, ref) => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [settings, setSettings] = useState<NotificationSettings>({
		retention_type: 'days',
		retention_days: '30',
	});
	const originalSettingsRef = useRef<NotificationSettings | null>(null);

	// Fetch settings on mount
	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = (await apiFetch({
					path: '/doublescale/v1/settings',
				})) as Settings;

				const notificationSettings: NotificationSettings = {
					retention_type: response.notifications?.retention_type ?? 'days',
					retention_days: response.notifications?.retention_days ?? '30',
				};

				setSettings(notificationSettings);
				originalSettingsRef.current = { ...notificationSettings };
			} catch (err) {
				// Use defaults if fetch fails
				console.error('Failed to fetch notification settings:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, []);

	// Check if settings have changed
	const hasChanges = useMemo(() => {
		if (!originalSettingsRef.current) {
			return false;
		}
		const original = originalSettingsRef.current;
		return (
			(settings.retention_type || 'days') !== (original.retention_type || 'days') ||
			(settings.retention_days || '30') !== (original.retention_days || '30')
		);
	}, [settings]);

	useEffect(() => {
		onDirtyChange?.(hasChanges);
	}, [hasChanges, onDirtyChange]);

	const handleFieldChange = (key: keyof NotificationSettings, value: string) => {
		setError(null);
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleSave = async () => {
		setError(null);

		try {
			// Fetch current settings first, then update only notifications
			const currentSettings = (await apiFetch({
				path: '/doublescale/v1/settings',
			})) as Settings;

			await apiFetch({
				path: '/doublescale/v1/settings',
				method: 'POST',
				data: {
					...currentSettings,
					notifications: settings,
				},
			});

			// Update original settings ref after successful save
			originalSettingsRef.current = { ...settings };
			onDirtyChange?.(false);
		} catch (err: any) {
			let errorMessage = __('Failed to save settings', 'doublescale');
			if (err?.message) {
				errorMessage = err.message;
			} else if (err?.data?.message) {
				errorMessage = err.data.message;
			}
			setError(errorMessage);
		}
	};

	useImperativeHandle(ref, () => ({ save: handleSave }));

	const sectionHeader = (action?: React.ReactNode) => (
		<div className="min-w-0 space-y-1">
			<div className="flex items-center justify-between gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex p-1.5 shrink-0 items-center justify-center rounded-full bg-white border border-border text-[#0D9DFC]">
						<IconDatabase size={20} />
					</div>
					<h2 className="lg:text-xl text-base font-semibold text-foreground">
						{__('Data Retention', 'doublescale')}
					</h2>
				</div>
				{action}
			</div>
			<p className="pl-[46px] lg:text-base text-sm text-muted-foreground">
				{__(
					'Configure how long notifications should be stored before automatic cleanup. This setting applies to all users.',
					'doublescale'
				)}
			</p>
		</div>
	);

	if (isLoading) {
		return (
			<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
				{sectionHeader()}
				<div className="flex items-center justify-center py-4">
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] p-6">
			{sectionHeader(
				<RadioGroup
					value={settings.retention_type || 'days'}
					onValueChange={(value) =>
						handleFieldChange('retention_type', value)
					}
					className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center"
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value="days"
							id="notification-radio-days"
						/>
						<Label
							htmlFor="notification-radio-days"
							className="cursor-pointer text-sm font-normal"
						>
							{__('Delete after specific days', 'doublescale')}
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem
							value="never"
							id="notification-radio-never"
						/>
						<Label
							htmlFor="notification-radio-never"
							className="cursor-pointer text-sm font-normal"
						>
							{__('Never delete (keep forever)', 'doublescale')}
						</Label>
					</div>
				</RadioGroup>
			)}

			{settings.retention_type === 'days' && (
				<div className="w-full">
					<Field
						label={__('Number of Days', 'doublescale')}
						value={settings.retention_days || '30'}
						onChange={(value) =>
							handleFieldChange('retention_days', value)
						}
						type="number"
						placeholder="30"
						helperText={__(
							'Notifications older than this many days will be automatically deleted',
							'doublescale'
						)}
					/>
				</div>
			)}

			{error && (
				<div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
					{error}
				</div>
			)}
		</section>
	);
});

NotificationRetentionSettings.displayName = 'NotificationRetentionSettings';

export default NotificationRetentionSettings;
