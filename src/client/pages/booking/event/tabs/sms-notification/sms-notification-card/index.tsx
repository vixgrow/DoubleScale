/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const { TextArea } = Input;

/**
 * External dependencies
 */
import { NotificationType } from '@/types/booking';
import { Header, MergeTagModal, UrlIcon } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import './style.scss';

type SmsNotificationCardProps = {
	notifications: Record<string, NotificationType>;
	notificationKey: string;
	setNotifications: (notifications: Record<string, NotificationType>) => void;
	setDisabled: (disabled: boolean) => void;
};

const SmsNotificationCard: React.FC<SmsNotificationCardProps> = ({
	notifications,
	notificationKey,
	setNotifications,
	setDisabled,
}) => {
	const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);
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

	// Update template.message in notifications
	const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateNotification({
			template: {
				...notification.template,
				message: e.target.value,
			},
		});
	};

	const handleSenderChange = (sender: string) => {
		updateNotification({
			template: {
				...notification.template,
				type: sender,
			},
		});
	};

	const handleMentionClick = (mention: string) => {
		const newMessage = (notification.template?.message || '') + mention;
		updateNotification({
			template: {
				...notification.template,
				message: newMessage,
			},
		});
		setMergeTagModal(false);
	};

	// Check if notification exists before rendering
	if (!notification) {
		return <Card><CardContent>No notification data found</CardContent></Card>;
	}

	return (
        <Card style={{ marginBottom: 16 }}><CardContent>
                <div className='flex flex-col gap-2.5 w-full'>
                    <div className='flex flex-col gap-2 w-full'>
                        <div className='flex justify-between items-center'>
                            <span className="text-[#09090B] text-[16px] font-semibold w-[540px]">
                                {__('SMS Body', 'doublescale')}
                                <span className="text-red-500">*</span>
                            </span>
                            <Button
                                className="bg-[#EEEEEE] p-2 rounded-lg border-none shadow-none"
                                onClick={() => setMergeTagModal(true)}
                            >
                                <UrlIcon />
                            </Button>
                        </div>
                        <div className="relative">
                            <TextArea
                                rows={6}
                                value={notification.template?.message || ''}
                                onChange={handleMessageChange}
                                className="w-full rounded-lg pr-10" // Add padding for the icon
                            />
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
                                    header={__('SMS Merge tags', 'doublescale')}
                                    subHeader={__(
                                        'Choose your Merge tags type and Select one of them related to your input.',
                                        'doublescale'
                                    )}
                                />
                            </div>
                            <MergeTagModal onMentionClick={handleMentionClick} />
                        </DialogContent></Dialog>

                    <div className='flex flex-col gap-2.5'>
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Sender', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </span>

                        <RadioGroup
                            value={notification.template?.type || ''}
                            className="text-[#3F4254] font-semibold flex gap-8"
                            onValueChange={(value) => handleSenderChange(value)}
                        >
                            <RadioGroupItem value="sms" className="custom-radio">
                                {__('SMS', 'doublescale')}
                            </RadioGroupItem>
                            <RadioGroupItem value="whatsapp" className="custom-radio">
                                {__('WhatsApp', 'doublescale')}
                            </RadioGroupItem>
                        </RadioGroup>
                    </div>
                </div>
            </CardContent></Card>
    );
};

export default SmsNotificationCard;
