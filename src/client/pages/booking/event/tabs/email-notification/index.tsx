/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useApi, useEvent, useNotice } from '@/hooks/booking';
import { NotificationType } from '@/types/booking';
import { CardHeader, EditNotificationIcon } from '@/components/booking';
import EmailNotificationCard from './email-notification-card';
import EmailTabs from './email-tabs';
import OtherNotifications from './other-notifications';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const EmailNotificationShimmer = () => {
	return (
        <div className="grid grid-cols-2 gap-5 px-9">
            <Card><CardContent>
                    <div className='flex flex-col gap-5'>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className='flex border-b pb-4'>
                                <div className='flex flex-col gap-2 w-full'>
                                    <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
                                    <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            <Card><CardContent>
                    <div className='flex justify-between items-center border-b pb-4 mb-4'>
                        <div className='flex flex-col gap-2'>
                            <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
                            <div className="animate-pulse bg-gray-200 h-4 w-64 rounded" />
                        </div>
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded-full" />
                    </div>
                    <div className='flex flex-col gap-4'>
                        <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
                        <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
                    </div>
                </CardContent></Card>
            <Card><CardContent>
                    <div className='flex flex-col gap-5'>
                        {[1, 2].map((i) => (
                            <div key={i} className='flex border-b pb-4'>
                                <div className='flex flex-col gap-2 w-full'>
                                    <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
                                    <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
        </div>
    );
};

export interface EmailNotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface EmailNotificationsTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

const EmailNotificationTab = forwardRef<
	EmailNotificationsTabHandle,
	EmailNotificationsTabProps
>((props, ref) => {
	const { currentEvent: event } = useEvent();
	const { callApi, loading } = useApi();
	const { successNotice } = useNotice();
	const [notificationSettings, setNotificationSettings] = useState<Record<
		string,
		NotificationType
	> | null>(null);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [isNoticeVisible, setNoticeVisible] = useState(true);
	const [notificationsLoaded, setNotificationsLoaded] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		fetchNotificationSettings();
	}, [event]);

	useEffect(() => {
		if (notificationsLoaded && notificationSettings && !editingKey) {
			const firstKey = Object.keys(notificationSettings)[0];
			if (firstKey) {
				setEditingKey(firstKey);
			}
			setInitialLoading(false);
		}
	}, [notificationsLoaded]);

	// Expose the saveSettings method through the ref
	useImperativeHandle(ref, () => ({
		saveSettings: async () => {
			if (notificationSettings) {
				return saveNotificationSettings();
			}
			return Promise.resolve();
		},
	}));

	const fetchNotificationSettings = () => {
		if (!event) {
			return;
		}
		callApi({
			path: `events/${event.id}/meta/email_notifications`,
			method: 'GET',
			onSuccess(response: Record<string, NotificationType>) {
				setNotificationSettings(response);
				setNotificationsLoaded(true);
			},
			onError(error) {
				throw new Error(error.message);
			},
		});
	};

	const handleSwitchChange = (checked, key) => {
		setNotificationSettings((prev) => {
			if (!prev) return prev;

			// Create a complete copy with all existing values
			const updated = { ...prev };

			// Update just the default property for this notification
			updated[key] = {
				...updated[key],
				default: checked,
			};

			return updated;
		});
	};

	const handleNotificationSelect = (key: string) => {
		// Only update if selecting a different notification
		if (editingKey !== key) {
			setEditingKey(key);
		}
	};

	const saveNotificationSettings = async () => {
		if (!event || !notificationSettings) return;

		try {
			return await callApi({
				path: `events/${event.id}`,
				method: 'POST',
				data: {
					[`email_notifications`]: notificationSettings,
				},
				onSuccess() {
					successNotice(
						__(
							'Notification settings saved successfully',
							'doublescale'
						)
					);
					props.setDisabled(true);
					setNotificationSettings(notificationSettings);
				},
				onError(error) {
					// This will be caught by the outer try-catch
					throw new Error(error.message);
				},
			});
		} catch (error) {
			console.error('Error in saveNotificationSettings:', error);
			// No error notice shown to the user
		}
	};

	if (initialLoading || !notificationSettings) {
		return <EmailNotificationShimmer />;
	}

	return (
        <div className="grid grid-cols-2 gap-5 px-9">
            <EmailTabs
				isNoticeVisible={isNoticeVisible}
				setNoticeVisible={setNoticeVisible}
				notificationSettings={notificationSettings}
				editingKey={editingKey}
				onSelect={handleNotificationSelect}
			/>
            <Card><CardContent>
                    <div className='flex justify-between items-center border-b mb-4'>
                        <CardHeader
                            title={__('Edit', 'doublescale')}
                            description={__(
                                'Booking Confirmation Email to Attendee',
                                'doublescale'
                            )}
                            icon={<EditNotificationIcon />}
                            border={false}
                        />
                        {editingKey && (
                            <Switch
                                checked={
                                    notificationSettings?.[editingKey]?.default ||
                                    false
                                }
                                onCheckedChange={(checked) =>
                                    handleSwitchChange(checked, editingKey)
                                }
                                className={
                                    notificationSettings?.[editingKey]?.default
                                        ? 'bg-primary'
                                        : 'bg-gray-400'
                                } />
                        )}
                    </div>
                    {editingKey && notificationSettings[editingKey] && (
                        <EmailNotificationCard
                            key={editingKey}
                            notifications={notificationSettings}
                            notificationKey={editingKey}
                            setNotifications={(updatedNotifications) => {
                                setNotificationSettings(updatedNotifications);
                            }}
                            setDisabled={props.setDisabled}
                        />
                    )}
                </CardContent></Card>
            <OtherNotifications
				notificationSettings={notificationSettings}
				setEditingKey={setEditingKey}
				editingKey={editingKey}
			/>
        </div>
    );
});

export default EmailNotificationTab;
