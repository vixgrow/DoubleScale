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
	NotificationRow,
} from '@/components/booking';
import { NotificationType } from '@/types/booking';
import { Card, CardContent } from '@/components/ui/card';

interface OtherNotificationsProps {
	notificationSettings: Record<string, NotificationType>;
	setEditingKey: (key: string | null) => void;
	editingKey: string | null;
}

const OtherNotifications: React.FC<OtherNotificationsProps> = ({
	notificationSettings,
	setEditingKey,
	editingKey,
}) => {
	/**
	 * Get description for each notification type
	 *
	 * @param {string} key - Notification key
	 * @returns {string} Description
	 */
	const getNotificationDescription = (key: string): string => {
		switch (key) {
			case 'host_approval':
				return __(
					'Notifies you of pending booking requests that require your approval. Includes attendee details and requested time slot.',
					'doublescale'
				);
			case 'host_rejection':
				return __(
					'Sent to attendees when their booking request is declined. Allows you to include a personalized reason for the rejection.',
					'doublescale'
				);
			case 'host_approved_attendee':
				return __(
					'Confirms to attendees that their booking request has been approved. Includes all booking details and calendar links.',
					'doublescale'
				);
			case 'attendee_submitted':
				return __(
					'Acknowledges receipt of booking requests to attendees. Explains the approval process and expected response time.',
					'doublescale'
				);
			default:
				return __(
					'This notification is sent when specific booking events occur. Customize the message to provide relevant information.',
					'doublescale'
				);
		}
	};

	return (
        <Card><CardContent>
                <CardHeader
                    title={__('Other Notification', 'doublescale')}
                    description={__(
                        'Optimize your email notifications for confirmations and declines',
                        'doublescale'
                    )}
                    icon={<EmailNotificationIcon />}
                />
                {notificationSettings &&
                    Object.entries(notificationSettings).map(
                        ([key, _notification], index) => {
                            if (index < 8) return null;

                            return (
                                <NotificationRow
                                    changedKey={editingKey}
                                    setEditingKey={setEditingKey}
                                    noticationKey={key}
                                    description={getNotificationDescription(key)}
                                    notification={_notification as NotificationType}
                                />
                            );
                        }
                    )}
            </CardContent></Card>
    );
};

export default OtherNotifications;
