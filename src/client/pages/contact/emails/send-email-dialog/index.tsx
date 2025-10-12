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
    DialogTitle,
    DialogOverlay,
} from '@/components/ui/dialog';
import {
    CustomDialogHeader,
    Field,
    GradientEmailIcon,
    TinyMCEWPEditor,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { Label } from '@quillcrm/components/ui/label';

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

    const isInteractableElement = (target: HTMLElement) => {
        const isTinyMCEElement = target.className &&
            typeof target.className === 'string' &&
            target.className.includes('tox-');

        return target.closest('.media-modal') ||
            target.closest('.media-modal-backdrop') ||
            target.closest('.tox-tinymce-aux') ||
            target.closest('.tox') ||
            isTinyMCEElement;
    };

    return (
        <>
            <style>{`
                .tox-tinymce-aux,
                .tox-menu,
                .tox-dialog,
                .tox-collection,
                .tox-swatches-menu,
                .tox-dialog-wrap,
                .tox-collection__item,
                .tox-swatch {
                    z-index: 999999 !important;
                    pointer-events: auto !important;
                }
                .tox-tinymce-aux * {
                    pointer-events: auto !important;
                }
            `}</style>
            <Dialog
                open={open}
                onOpenChange={(isOpen) => !isOpen && onClose()}
            >
                <DialogOverlay className="z-[150200]" />
                <DialogContent
                    className="max-w-[500px] z-[150200]"
                    style={{ overflow: 'visible' }}
                    onPointerDownOutside={(e) => {
                        // Allow interaction with WordPress media modal and TinyMCE menus
                        const target = e.target as HTMLElement;
                        isInteractableElement(target) && e.preventDefault();
                    }}
                    onInteractOutside={(e) => {
                        // Allow interaction with WordPress media modal and TinyMCE menus
                        const target = e.target as HTMLElement;
                        isInteractableElement(target) && e.preventDefault();
                    }}
                >
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
                        <div>
                            <Label className="text-[#09090B] font-normal text-base">
                                {__('Body', 'quillcrm')}
                            </Label>
                            <div className="mt-2">
                                <TinyMCEWPEditor
                                    value={body}
                                    onChange={(content) => setBody(content)}
                                    height={350}
                                    toolbar="fontfamily fontsize styles forecolor outdent indent bullist numlist link image mergetags"
                                    plugins={[
                                        'lists',
                                        'link',
                                        'advlist',
                                        'code',
                                    ]}
                                    init={{
                                        base_z_index: 999999,
                                        font_family_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Tahoma=tahoma,arial,helvetica,sans-serif; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva',
                                        font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                                        inline_boundaries: false,
                                        removed_menuitems: '',
                                    }}
                                    placeholder={__('Enter email body...', 'quillcrm')}
                                    showMergeTags={true}
                                />
                            </div>
                        </div>
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
        </>
    );
};

export default SendEmailDialog;
