/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button } from 'antd';

/**
 * Internal dependencies
 */
import type { Form } from '@quillcrm/client';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';
import { isEmpty } from 'validator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface CreateFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CreateFormDialog: React.FC<CreateFormDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
    });
    const navigate = useNavigate();
    const { createNotice } = useDispatch('quillcrm/core');

    const createForm = async () => {
        if (isEmpty(form.name, { ignore_whitespace: true })) {
            createNotice({
                type: 'error',
                message: __('Form name is required', 'quillcrm'),
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = (await apiFetch({
                path: '/qc/v1/forms',
                method: 'POST',
                data: form,
            })) as Form;

            navigate(getToLink(`forms/${response.id}`));
            onOpenChange(false);
            // Reset form
            setForm({ name: '' });
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        // Reset form
        setForm({ name: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{__('Create Form', 'quillcrm')}</DialogTitle>
                    <DialogDescription>
                        {__('Enter a name for your new form.', 'quillcrm')}
                    </DialogDescription>
                </DialogHeader>
                <div className="qcrm-fields py-4">
                    <Field
                        label={__('Name', 'quillcrm')}
                        value={form.name}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                name: value,
                            })
                        }
                        type="text"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleCancel} disabled={isSaving}>
                        {__('Cancel', 'quillcrm')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={createForm}
                        loading={isSaving}
                    >
                        {__('Create Form', 'quillcrm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFormDialog;