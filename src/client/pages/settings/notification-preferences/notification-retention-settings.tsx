/**
 * Notification Retention Settings
 *
 * Configures how long notifications are stored before automatic cleanup.
 * This is an admin-only setting that affects all users.
 * Fetches and saves settings independently from the main settings page.
 *
 * @since 1.2.0
 * @package DoubleScale\Pro
 */

import { useState, useRef, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/components/ui/radio-group';
import { Label } from '@doublescale/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

interface NotificationSettings {
	retention_type: 'days' | 'never' | null;
	retention_days: string | null;
}

const NotificationRetentionSettings: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
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

	const handleFieldChange = (key: keyof NotificationSettings, value: string) => {
		setError(null);
		setSaveSuccess(false);
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleSave = async () => {
		setIsSaving(true);
		setError(null);
		setSaveSuccess(false);

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
			setSaveSuccess(true);

			// Clear success message after 3 seconds
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (err: any) {
			let errorMessage = __('Failed to save settings', 'doublescale');
			if (err?.message) {
				errorMessage = err.message;
			} else if (err?.data?.message) {
				errorMessage = err.data.message;
			}
			setError(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{__('Data Retention', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-4">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{__('Data Retention', 'doublescale')}</CardTitle>
				<CardDescription>
					{__(
						'Configure how long notifications should be stored before automatic cleanup. This setting applies to all users.',
						'doublescale'
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<RadioGroup
					value={settings.retention_type || 'days'}
					onValueChange={(value) =>
						handleFieldChange('retention_type', value)
					}
				>
					<div className="space-y-4">
						{/* Specific Days Option */}
						<div className="flex items-start space-x-3">
							<RadioGroupItem
								value="days"
								id="notification-radio-days"
								className="mt-1"
							/>
							<div className="flex-1">
								<Label
									htmlFor="notification-radio-days"
									className="font-normal cursor-pointer"
								>
									{__('Delete after specific days', 'doublescale')}
								</Label>
								{settings.retention_type === 'days' && (
									<div className="mt-3 max-w-xs">
										<Field
											label={__('Number of Days', 'doublescale')}
											value={settings.retention_days || '30'}
											onChange={(value) =>
												handleFieldChange(
													'retention_days',
													value
												)
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
							</div>
						</div>

						{/* Never Delete Option */}
						<div className="flex items-center space-x-3">
							<RadioGroupItem
								value="never"
								id="notification-radio-never"
							/>
							<Label
								htmlFor="notification-radio-never"
								className="font-normal cursor-pointer"
							>
								{__('Never delete (keep forever)', 'doublescale')}
							</Label>
						</div>
					</div>
				</RadioGroup>

				{error && (
					<div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
						{error}
					</div>
				)}
			</CardContent>
			<CardFooter className="border-t pt-4 justify-end">
				<Button
					onClick={handleSave}
					disabled={isSaving || !hasChanges}
					variant={saveSuccess ? 'outline' : 'gradient'}
					className="min-w-[140px]"
				>
					{isSaving ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							{__('Saving...', 'doublescale')}
						</>
					) : saveSuccess ? (
						<>
							<CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
							{__('Saved!', 'doublescale')}
						</>
					) : (
						<>
							<Save className="w-4 h-4 mr-2" />
							{__('Save Settings', 'doublescale')}
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
};

export default NotificationRetentionSettings;
