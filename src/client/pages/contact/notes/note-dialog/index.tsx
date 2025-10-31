/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Note } from '@quillcrm/client';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogPortal,
} from '@/components/ui/dialog';
import {
    CustomDialogHeader,
    Field,
    GradientNotesIcon,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';

interface NoteDialogProps {
    open: boolean;
    onClose: () => void;
    contact_id: number;
    selectedNote: Note | null;
    onSave: (note: Note) => void;
    onUpdate: (note: Note) => void;
    showNotice: (type: 'success' | 'error', message: string) => void;
}

const NoteDialog: React.FC<NoteDialogProps> = ({
    open,
    onClose,
    contact_id,
    selectedNote,
    onSave,
    onUpdate,
    showNotice,
}) => {
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<string>('note');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{
        title?: string;
        note?: string;
    }>({});

    useEffect(() => {
        if (selectedNote) {
            setTitle(selectedNote.title);
            setNote(selectedNote.note);
            setType(selectedNote.type);
        } else {
            setTitle('');
            setNote('');
            setType('note');
        }
        // Clear errors when dialog opens/closes
        setErrors({});
    }, [selectedNote, open]);

    const validate = () => {
        const newErrors: { title?: string; note?: string } = {};

        if (!title.trim()) {
            newErrors.title = __('Title is required', 'quillcrm');
        }

        if (!note.trim()) {
            newErrors.note = __('Note is required', 'quillcrm');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            return;
        }

        setIsSaving(true);

        try {
            if (selectedNote) {
                // Update existing note
                const response = (await apiFetch({
                    path: `/qc/v1/contact-notes/${selectedNote.id}`,
                    method: 'PUT',
                    data: {
                        title,
                        note,
                        type,
                        contact_id,
                    },
                })) as Note;

                onUpdate(response);
                showNotice('success', __('Note updated successfully', 'quillcrm'));
            } else {
                // Create new note
                const response = (await apiFetch({
                    path: `/qc/v1/contact-notes`,
                    method: 'POST',
                    data: {
                        title,
                        note,
                        type,
                        contact_id,
                    },
                })) as Note;

                onSave(response);
                showNotice('success', __('Note saved successfully', 'quillcrm'));
            }

            onClose();
        } catch (error: any) {
            showNotice('error', error.message || __('Failed to save note', 'quillcrm'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogPortal>
            <DialogOverlay className="z-[150200] h-screen" />
            <DialogContent className="max-w-[500px] z-[150200]">
                <DialogHeader>
                    <DialogTitle>
                        <CustomDialogHeader
                            title={
                                selectedNote
                                    ? __('Edit Note', 'quillcrm')
                                    : __('Add Note', 'quillcrm')
                            }
                            subtitle={
                                selectedNote
                                    ? __('Update the note details', 'quillcrm')
                                    : __(
                                        'Add a new note to the contact',
                                        'quillcrm'
                                    )
                            }
                            icon={<GradientNotesIcon width={24} height={24} />}
                        />
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Field
                        label={__('Title', 'quillcrm')}
                        placeholder={__('Enter title', 'quillcrm')}
                        value={title}
                        onChange={(value) => {
                            setTitle(value);
                            if (errors.title) {
                                setErrors({ ...errors, title: undefined });
                            }
                        }}
                        type="text"
                        status={errors.title ? 'error' : undefined}
                        helperText={errors.title}
                    />
                    <Field
                        label={__('Type', 'quillcrm')}
                        placeholder={__('Select type', 'quillcrm')}
                        value={type}
                        onChange={(value) => setType(value)}
                        type="select"
                        options={[
                            { label: __('Note', 'quillcrm'), value: 'note' },
                            { label: __('Reminder', 'quillcrm'), value: 'reminder' },
                        ]}
                    />
                    <Field
                        label={__('Note', 'quillcrm')}
                        placeholder={__('Enter note', 'quillcrm')}
                        value={note}
                        onChange={(value) => {
                            setNote(value);
                            if (errors.note) {
                                setErrors({ ...errors, note: undefined });
                            }
                        }}
                        type="textarea"
                        status={errors.note ? 'error' : undefined}
                        helperText={errors.note}
                    />
                </div>
                <DialogFooter className="mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="xl"
                        variant="gradient"
                        className="w-full"
                    >
                        {isSaving
                            ? __('Saving...', 'quillcrm')
                            : selectedNote
                                ? __('Update Note', 'quillcrm')
                                : __('Save Note', 'quillcrm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default NoteDialog;
