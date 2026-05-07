/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Note } from '@doublescale/client';
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
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';

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
            newErrors.title = __('Title is required', 'doublescale');
        }

        if (!note.trim()) {
            newErrors.note = __('Note is required', 'doublescale');
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
                    path: `/qc/v1/activities/${selectedNote.id}`,
                    method: 'PATCH',
                    data: {
                        title,
                        content: note,
                    },
                })) as Note;

                onUpdate(response);
                showNotice('success', __('Note updated successfully', 'doublescale'));
            } else {
                // Create new note
                const response = (await apiFetch({
                    path: `/qc/v1/activities/notes`,
                    method: 'POST',
                    data: {
                        title,
                        content: note,
                        contact_id,
                    },
                })) as Note;

                onSave(response);
                showNotice('success', __('Note saved successfully', 'doublescale'));
            }

            onClose();
        } catch (error: any) {
            showNotice('error', error.message || __('Failed to save note', 'doublescale'));
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
                                    ? __('Edit Note', 'doublescale')
                                    : __('Add Note', 'doublescale')
                            }
                            subtitle={
                                selectedNote
                                    ? __('Update the note details', 'doublescale')
                                    : __(
                                        'Add a new note to the contact',
                                        'doublescale'
                                    )
                            }
                            icon={<GradientNotesIcon width={24} height={24} />}
                        />
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Field
                        label={__('Title', 'doublescale')}
                        placeholder={__('Enter title', 'doublescale')}
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
                    {/* <Field
                        label={__('Type', 'doublescale')}
                        placeholder={__('Select type', 'doublescale')}
                        value={type}
                        onChange={(value) => setType(value)}
                        type="select"
                        options={[
                            { label: __('Note', 'doublescale'), value: 'note' },
                            { label: __('Reminder', 'doublescale'), value: 'reminder' },
                        ]}
                    /> */}
                    <Field
                        label={__('Note', 'doublescale')}
                        placeholder={__('Enter note', 'doublescale')}
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
                            ? __('Saving...', 'doublescale')
                            : selectedNote
                                ? __('Update Note', 'doublescale')
                                : __('Save Note', 'doublescale')}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default NoteDialog;
