/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import type { Contact } from '@quillcrm/client';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CustomDialogHeader,
    Field,
    GradientEmailIcon,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';

interface SendEmailDialogProps {
    open: boolean;
    onClose: () => void;
    contact: Contact | null;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
    open,
    onClose,
    contact,
}) => {
    const [toEmail, setToEmail] = useState(contact?.email || '');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const sendEmail = () => {
        setIsSending(true);
        console.log({ toEmail, subject, body, contact });
        // TODO: Implement actual email sending logic
        setIsSending(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => !isOpen && onClose()}
        >
            <DialogOverlay className="z-[1700000]"/>
            <DialogContent className="max-w-[500px] z-[1700000]">
                <DialogHeader>
                    <DialogTitle>
                        <CustomDialogHeader
                            title={__('Send Email', 'quillcrm')}
                            subtitle={__(
                                'Send an email to the contact',
                                'quillcrm'
                            )}
                            icon={<GradientEmailIcon />}
                        />
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Field
                        label={__('To', 'quillcrm')}
                        placeholder={__('Enter To Email', 'quillcrm')}
                        value={toEmail || contact?.email || ''}
                        onChange={(value) => setToEmail(value)}
                        type="text"
                    />
                    <Field
                        label={__('Subject', 'quillcrm')}
                        placeholder={__('Enter Subject', 'quillcrm')}
                        value={subject}
                        onChange={(value) => setSubject(value)}
                        type="text"
                    />
                    <Field
                        label={__('Body', 'quillcrm')}
                        placeholder={__('Enter Body', 'quillcrm')}
                        value={body}
                        onChange={(value) => setBody(value)}
                        type="text"
                    />
                </div>
                <DialogFooter className="mt-6">
                    <Button
                        onClick={sendEmail}
                        disabled={isSending}
                        size="xl"
                        variant="gradient"
                        className="w-full"
                    >
                        {isSending
                            ? __('Sending...', 'quillcrm')
                            : __('Send Email', 'quillcrm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailDialog;
