/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { ReactMultiEmail } from 'react-multi-email';
import 'react-multi-email/dist/style.css';
import './style.scss';

/**
 * Interanl dependencies
 */
import { NotificationType } from '@/types/booking';
import {
	Header,
	LimitsAddIcon,
	LimitsTrashIcon,
	MergeTagModal,
	UrlIcon,
	Editor,
} from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EmailNotificationCardProps = {
	notifications: Record<string, NotificationType>;
	notificationKey: string;
	setNotifications: (notifications: Record<string, NotificationType>) => void;
	setDisabled: (disabled: boolean) => void;
};

const EmailNotificationCard: React.FC<EmailNotificationCardProps> = ({
	notifications,
	notificationKey,
	setNotifications,
	setDisabled,
}) => {
	const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);

	// Get current notification directly from the parent state
	const notification = notifications[notificationKey];

	// General function to update the notification
	const updateNotification = (changes: Partial<NotificationType>) => {
		const updatedSettings = {
			...notifications,
			[notificationKey]: {
				...notifications[notificationKey],
				...changes,
			},
		};
		setNotifications(updatedSettings);
		if (JSON.stringify(updatedSettings) !== JSON.stringify(notifications)) {
			setDisabled(false); // enable save button
		}
	};

	// Update template.subject in notifications
	const handleSubjectChange = (newSubject: string) => {
		updateNotification({
			template: {
				...notification.template,
				subject: newSubject,
			},
		});
	};

	// Update template.message in notifications
	const handleMessageChange = (newMessage: string) => {
		updateNotification({
			template: {
				...notification.template,
				message: newMessage,
			},
		});
	};

	// Update recipients in notifications
	const handleRecipientsChange = (newRecipients: string[]) => {
		updateNotification({ recipients: newRecipients });
	};

	// Handle adding a new time
	const handleAddTime = () => {
		const newTimes = [
			...(notification.times || []),
			{ value: 15, unit: 'minutes' },
		];
		updateNotification({ times: newTimes });
	};

	// Handle removing a time
	const handleRemoveTime = (index: number) => {
		const newTimes = [...(notification.times || [])];
		newTimes.splice(index, 1);
		updateNotification({ times: newTimes });
	};

	// Handle changing a time value
	const handleTimeValueChange = (index: number, value: number) => {
		const newTimes = [...(notification.times || [])];
		newTimes[index].value = value;
		updateNotification({ times: newTimes });
	};

	// Handle changing a time unit
	const handleTimeUnitChange = (index: number, unit: string) => {
		const newTimes = [...(notification.times || [])];
		newTimes[index].unit = unit;
		updateNotification({ times: newTimes });
	};

	const handleMentionClick = (mention: string) => {
		const newSubject = (notification.template?.subject || '') + mention;
		handleSubjectChange(newSubject);
		setMergeTagModal(false);
	};

	return (
        <Card style={{ marginBottom: 16 }}><CardContent>
                <div className='flex flex-col gap-2.5 w-full'>
                    <div className="w-full mb-6">
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Subject', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </span>
                        <div className="flex items-center mt-2 h-[48px] rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                            <Input
                                value={notification.template?.subject || ''}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                placeholder="New Booking: {{guest:name}} @ {{booking:start_time}}"
                                className="h-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <span
                                className="bg-[#EEEEEE] p-[0.7rem] cursor-pointer"
                                onClick={() => setMergeTagModal(true)}
                            >
                                <UrlIcon />
                            </span>
                        </div>
                    </div>

                    <Dialog
                        open={mergeTagModal}
                        onOpenChange={open => {
                            if (!open)
                                (() => setMergeTagModal(false))();
                        }}><DialogContent className='max-w-[1000px]'>
                            <div className='flex gap-2.5 items-center border-b pb-4 mb-4'>
                                <div className="bg-[#EDEDED] rounded-lg p-3 mt-2">
                                    <UrlIcon />
                                </div>
                                <Header
                                    header={__('Subject Merge tags', 'doublescale')}
                                    subHeader={__(
                                        'Choose your Merge tags type and Select one of them related to your input.',
                                        'doublescale'
                                    )}
                                />
                            </div>
                            <MergeTagModal onMentionClick={handleMentionClick} />
                        </DialogContent></Dialog>

                    <div className="w-full mb-5">
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Email Body', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </span>
                        <div className="mt-2">
                            <Editor
                                message={notification.template?.message || ''}
                                onChange={handleMessageChange}
                                type="email"
                            />
                        </div>
                    </div>

                    <div className="w-full mb-5">
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Additional Recipients', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </span>
                        <div className="mt-2">
                            <ReactMultiEmail
                                placeholder={__(
                                    'Enter email addresses separated by commas',
                                    'doublescale'
                                )}
                                emails={notification.recipients || []}
                                onChange={handleRecipientsChange}
                                autoFocus={false}
                                getLabel={(email, index, removeEmail) => {
                                    return (
                                        <div data-tag key={index}>
                                            <div data-tag-item>{email}</div>
                                            <span
                                                data-tag-handle
                                                onClick={() =>
                                                    removeEmail(index)
                                                }
                                            >
                                                ×
                                            </span>
                                        </div>
                                    );
                                }}
                                className="booking-react-multi-email w-full"
                            />
                        </div>
                        <span className="text-[#818181]">
                            {__(
                                'Provided email address will set as CC to this email notification.',
                                'doublescale'
                            )}
                        </span>
                    </div>

                    {notification.times && (
                        <div className="w-full mb-5">
                            <span className="text-[#09090B] text-[16px] font-semibold">
                                {__('Timing', 'doublescale')}
                                <span className="text-red-500">*</span>
                            </span>
                            <div className='flex flex-col gap-2.5 mt-2'>
                                {(notification.times || []).map((time, index) => (
                                    <div key={index} className='flex items-center gap-2.5'>
                                        <Input
                                            type='number'
                                            value={time.value}
                                            onChange={(e) =>
                                                handleTimeValueChange(
                                                    index,
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="h-[48px] rounded-lg pt-2 w-16"
                                        />
                                        <Select
                                            value={time.unit}
                                            onValueChange={(unit) =>
                                                handleTimeUnitChange(index, unit)
                                            }
                                        >
                                            <SelectTrigger className="h-[48px] rounded-lg w-44">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="minutes">
                                                    {__(
                                                        'Minutes Before',
                                                        'doublescale'
                                                    )}
                                                </SelectItem>
                                                <SelectItem value="hours">
                                                    {__(
                                                        'Hours Before',
                                                        'doublescale'
                                                    )}
                                                </SelectItem>
                                                <SelectItem value="days">
                                                    {__(
                                                        'Days Before',
                                                        'doublescale'
                                                    )}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Only show Remove button if it's NOT the first item */}
                                        {index > 0 && (
                                            <Button
                                                onClick={() =>
                                                    handleRemoveTime(index)
                                                }
                                                className="border-none shadow-none p-0 h-8 w-8 text-white"
                                                variant='destructive'
                                            >
                                                <LimitsTrashIcon />
                                            </Button>
                                        )}

                                        {/* Only show Add button beside the first item */}
                                        {index === 0 && (
                                            <Button
                                                onClick={handleAddTime}
                                                className="border-none shadow-none p-0 h-8 w-8"
                                            >
                                                <LimitsAddIcon />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent></Card>
    );
};

export default EmailNotificationCard;
