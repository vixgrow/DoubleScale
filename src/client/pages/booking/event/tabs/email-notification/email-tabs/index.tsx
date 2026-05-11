/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	CardHeader,
	EmailNotificationIcon,
	NoticeComponent,
	NotificationRow,
} from '@/components/booking';

import { NotificationType } from '@/types/booking';
import { Card, CardContent } from '@/components/ui/card';

interface EmailTabsProps {
	isNoticeVisible: boolean;
	setNoticeVisible: (visible: boolean) => void;
	notificationSettings: Record<string, NotificationType>;
	editingKey: string | null;
	onSelect: (key: string) => void; // Only accepts string, not null
}
const EmailTabs: React.FC<EmailTabsProps> = ({
	isNoticeVisible,
	setNoticeVisible,
	notificationSettings,
	editingKey,
	onSelect,
}) => {
	/**
	 * Get description for each notification type
	 *
	 * @param {string} key - Notification key
	 * @returns {string} Description
	 */
	const getNotificationDescription = (key: string): string => {
		switch (key) {
			case 'attendee_confirmation':
				return __(
					'Automatically sent to attendees when their booking is confirmed. Includes booking details, location, and cancellation options.',
					'doublescale'
				);
			case 'organizer_notification':
				return __(
					'Notifies you immediately when a new booking is made. Contains attendee information and booking details.',
					'doublescale'
				);
			case 'attendee_reminder':
				return __(
					'Reminds attendees about their upcoming appointment. Can be scheduled to send at specific times before the event.',
					'doublescale'
				);
			case 'organizer_reminder':
				return __(
					'Sends you a reminder about upcoming appointments. Customizable timing to help you prepare for scheduled events.',
					'doublescale'
				);
			case 'attendee_cancelled_organizer':
				return __(
					'Alerts you when an attendee cancels their booking. Includes cancellation reason and original booking details.',
					'doublescale'
				);
			case 'organizer_cancelled_attendee':
				return __(
					'Informs attendees when you cancel their booking. Helps maintain good communication and professionalism.',
					'doublescale'
				);
			case 'attendee_rescheduled_organizer':
				return __(
					'Notifies you when an attendee reschedules. Shows both original and new booking times for easy reference.',
					'doublescale'
				);
			case 'organizer_rescheduled_attendee':
				return __(
					'Confirms to attendees when you reschedule their appointment. Includes updated time and location details.',
					'doublescale'
				);
			default:
				return __(
					'This email will be sent to the attendee if email is provided during booking.',
					'doublescale'
				);
		}
	};

	return (
        <Card><CardContent>
                <CardHeader
                    title={__('Email Notification', 'doublescale')}
                    description={__(
                        'Customize the email notifications sent to attendees and organizers',
                        'doublescale'
                    )}
                    icon={<EmailNotificationIcon />}
                />
                <div className="mt-4">
                    <NoticeComponent
                        isNoticeVisible={isNoticeVisible}
                        setNoticeVisible={setNoticeVisible}
                    />

                    {notificationSettings &&
                        Object.entries(notificationSettings).map(
                            ([key, notification], index) => {
                                if (index >= 8) return null;
                                return (
                                    <NotificationRow
                                        description={getNotificationDescription(
                                            key
                                        )}
                                        noticationKey={key}
                                        changedKey={editingKey}
                                        setEditingKey={(key: string | null) => {
                                            key &&
                                                editingKey !== key &&
                                                onSelect(key);
                                        }}
                                        notification={
                                            notification as NotificationType
                                        }
                                    />
                                );
                            }
                        )}
                </div>
            </CardContent></Card>
    );
};

export default EmailTabs;
