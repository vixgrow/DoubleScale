/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

/**
 * Internal dependencies
 */
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
    GradientAddCallIcon,
    GradientCallsIcon,
    PlusIcon,
} from '@quillcrm/components';
import { useContactContext } from '../../state/context';
import { Button } from '@quillcrm/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@quillcrm/components/date-time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import TrashIcon from '@quillcrm/components/icons/trash';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Call {
    id: number;
    contact_id: number;
    activity_type: string;
    data: {
        phone_number?: string;
        duration?: number;
        outcome?: string;
        notes?: string;
        called_at?: string;
    };
    created_at: string;
    updated_at?: string;
}

interface CallDialogProps {
    open: boolean;
    onClose: () => void;
    contact_id: number;
    selectedCall: Call | null;
    onSave: (call: Call) => void;
    onUpdate: (call: Call) => void;
    showNotice: (type: 'success' | 'error', message: string) => void;
}

interface CallFormData {
    phoneNumber: string;
    duration: number;
    outcome: string;
    callDate: Date | null;
    notes: string;
    createTask: boolean;
    dueDate: Date | null;
    setReminder: boolean;
    reminderDates: Date[];
}

const CallDialog: React.FC<CallDialogProps> = ({
    open,
    onClose,
    contact_id,
    selectedCall,
    onSave,
    onUpdate,
    showNotice,
}) => {
    const { contact } = useContactContext();
    const [formData, setFormData] = useState<CallFormData>({
        phoneNumber: '',
        duration: 60,
        outcome: 'completed',
        callDate: new Date(),
        notes: '',
        createTask: false,
        dueDate: null,
        setReminder: false,
        reminderDates: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{
        notes?: string;
    }>({});

    useEffect(() => {
        if (selectedCall) {
            setFormData({
                phoneNumber: selectedCall.data?.phone_number || contact?.phone || '',
                duration: selectedCall.data?.duration || 60,
                outcome: selectedCall.data?.outcome || 'completed',
                callDate: selectedCall.data?.called_at
                    ? new Date(selectedCall.data.called_at)
                    : new Date(selectedCall.created_at),
                notes: selectedCall.data?.notes || '',
                createTask: false,
                dueDate: null,
                setReminder: false,
                reminderDates: [],
            });
        } else {
            setFormData({
                phoneNumber: contact?.phone || '',
                duration: 60,
                outcome: 'completed',
                callDate: new Date(),
                notes: '',
                createTask: false,
                dueDate: null,
                setReminder: false,
                reminderDates: [],
            });
        }
        setErrors({});
    }, [selectedCall, open, contact]);

    const updateFormData = (updates: Partial<CallFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const addReminder = (index?: number) => {
        setFormData((prev) => {
            // If index is provided, add after that index, otherwise add at the end
            if (index !== undefined) {
                const newDates = [...prev.reminderDates];
                newDates.splice(index + 1, 0, new Date());
                return {
                    ...prev,
                    reminderDates: newDates,
                };
            }
            // Add new reminder at the end
            return {
                ...prev,
                reminderDates: [...prev.reminderDates, new Date()],
            };
        });
    };

    const removeReminder = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            reminderDates: prev.reminderDates.filter((_, i) => i !== index),
        }));
    };

    // Helper function to parse formatted date string from DatePicker
    const parseFormattedDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        // DatePicker returns format like "January 15, 2024" or "15 January 2024"
        // Try parsing as-is first
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        return null;
    };

    const updateReminderDate = (index: number, dateString: string) => {
        const date = parseFormattedDate(dateString);
        if (date) {
            setFormData((prev) => ({
                ...prev,
                reminderDates: prev.reminderDates.map((d, i) =>
                    i === index ? date : d
                ),
            }));
        }
    };

    const validate = () => {
        const newErrors: { notes?: string } = {};

        if (!formData.notes.trim()) {
            newErrors.notes = __('Call notes are required', 'quillcrm');
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
            const callData = {
                phone_number: formData.phoneNumber || undefined,
                duration: formData.duration,
                outcome: formData.outcome,
                notes: formData.notes.trim(),
                called_at: formData.callDate
                    ? dayjs(formData.callDate).format('YYYY-MM-DD HH:mm:ss')
                    : dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            if (selectedCall) {
                // Update existing call
                const response = (await apiFetch({
                    path: `/qc/v1/activities/${selectedCall.id}`,
                    method: 'PATCH',
                    data: {
                        call_data: callData,
                    },
                })) as Call;

                onUpdate(response);
                showNotice(
                    'success',
                    __('Call updated successfully', 'quillcrm')
                );
            } else {
                // Create new call
                const response = (await apiFetch({
                    path: `/qc/v1/activities/calls`,
                    method: 'POST',
                    data: {
                        contact_id,
                        call_data: callData,
                    },
                })) as Call;

                onSave(response);
                showNotice(
                    'success',
                    __('Call logged successfully', 'quillcrm')
                );
            }

            onClose();
        } catch (error: any) {
            showNotice(
                'error',
                error.message || __('Failed to save call', 'quillcrm')
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogPortal>
                <DialogOverlay className="z-[150200] h-screen" />
                <DialogContent className="max-w-[600px] z-[150200] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            <CustomDialogHeader
                                title={
                                    selectedCall
                                        ? __('Edit Log Call', 'quillcrm')
                                        : __('Add Log Call', 'quillcrm')
                                }
                                subtitle={
                                    selectedCall
                                        ? __(
                                            'Update the call details',
                                            'quillcrm'
                                        )
                                        : __(
                                            'Log a new call for this contact',
                                            'quillcrm'
                                        )
                                }
                                icon={
                                    <GradientAddCallIcon
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Phone Number */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Phone Number', 'quillcrm')}
                                </Label>
                                <Input
                                    placeholder={__(
                                        'Enter phone number',
                                        'quillcrm'
                                    )}
                                    value={formData.phoneNumber}
                                    onChange={(e) =>
                                        updateFormData({
                                            phoneNumber: e.target.value,
                                        })
                                    }
                                    className="h-12"
                                    disabled
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Duration (minutes)', 'quillcrm')}
                                </Label>
                                <Select
                                    value={formData.duration.toString()}
                                    onValueChange={(value) =>
                                        updateFormData({
                                            duration: Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">
                                            15 {__('minutes', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="30">
                                            30 {__('minutes', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="45">
                                            45 {__('minutes', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="60">
                                            1 {__('hour', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="90">
                                            1.5 {__('hours', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="120">
                                            2 {__('hours', 'quillcrm')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Call Outcome */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Call Outcome', 'quillcrm')}
                                </Label>
                                <Select
                                    value={formData.outcome}
                                    onValueChange={(value) =>
                                        updateFormData({ outcome: value })
                                    }
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="completed">
                                            {__('Completed', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="no_answer">
                                            {__('No Answer', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="busy">
                                            {__('Busy', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="voicemail">
                                            {__('Voicemail', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="callback_requested">
                                            {__(
                                                'Callback Requested',
                                                'quillcrm'
                                            )}
                                        </SelectItem>
                                        <SelectItem value="not_interested">
                                            {__('Not Interested', 'quillcrm')}
                                        </SelectItem>
                                        <SelectItem value="follow_up">
                                            {__('Follow Up', 'quillcrm')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Call Date & Time */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Call Date & Time', 'quillcrm')}
                                </Label>
                                <DateTimePicker
                                    value={formData.callDate}
                                    onChange={(date) =>
                                        updateFormData({ callDate: date })
                                    }
                                    placeholder={__(
                                        'Select date & time',
                                        'quillcrm'
                                    )}
                                    className="h-12"
                                />
                            </div>
                        </div>

                        {/* Call Notes */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-normal text-[#09090B]">
                                {__('Call Notes', 'quillcrm')}{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                placeholder={__(
                                    'Enter call notes, discussion points, next steps...',
                                    'quillcrm'
                                )}
                                value={formData.notes}
                                onChange={(e) => {
                                    updateFormData({ notes: e.target.value });
                                    if (errors.notes) {
                                        setErrors({
                                            ...errors,
                                            notes: undefined,
                                        });
                                    }
                                }}
                                rows={4}
                                className={errors.notes ? 'border-red-500' : ''}
                            />
                            {errors.notes && (
                                <p className="text-sm text-red-500">
                                    {errors.notes}
                                </p>
                            )}
                        </div>

                        {/* Create a task to follow up */}
                        <div className="flex items-center gap-2 border-t pt-4">
                            <Checkbox
                                id="create-task"
                                checked={formData.createTask}
                                onCheckedChange={(checked) =>
                                    updateFormData({
                                        createTask: checked as boolean,
                                    })
                                }
                            />
                            <Label
                                htmlFor="create-task"
                                className="text-base font-normal text-[#09090B] cursor-pointer"
                            >
                                {__('Create a task to follow up', 'quillcrm')}
                            </Label>
                        </div>

                        {/* Due date (shown when createTask is checked) */}
                        {formData.createTask && (
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Due date', 'quillcrm')}
                                </Label>
                                <DatePicker
                                    value={formData.dueDate}
                                    onChange={(dateString) => {
                                        const date =
                                            parseFormattedDate(dateString);
                                        updateFormData({ dueDate: date });
                                    }}
                                    placeholder={__(
                                        'Select due date',
                                        'quillcrm'
                                    )}
                                    className="h-12"
                                    buttonClassName="h-12 w-full bg-white border border-[#DEE1E6] rounded-[8px] text-[#09090B] font-normal"
                                />
                            </div>
                        )}

                        {/* Set Reminder */}
                        {formData.createTask && (
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Set Reminder', 'quillcrm')}
                                </Label>
                                <Switch
                                    checked={formData.setReminder}
                                    onCheckedChange={(checked) => {
                                        if (checked && formData.reminderDates.length === 0) {
                                            // Initialize with first reminder when enabling
                                            setFormData((prev) => ({
                                                ...prev,
                                                setReminder: true,
                                                reminderDates: [new Date()],
                                            }));
                                        } else {
                                            updateFormData({
                                                setReminder: checked as boolean,
                                            });
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* Reminder Dates (shown when setReminder is checked) */}
                        {formData.createTask && formData.setReminder && formData.reminderDates.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {formData.reminderDates.map(
                                    (reminderDate, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col gap-2"
                                        >
                                            <Label className="text-base font-normal text-[#09090B]">
                                                {__(
                                                    'Reminder Date',
                                                    'quillcrm'
                                                )}{' '}
                                                {index > 0
                                                    ? `#${index + 1}`
                                                    : ''}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <DatePicker
                                                    value={reminderDate}
                                                    onChange={(
                                                        dateString
                                                    ) =>
                                                        updateReminderDate(
                                                            index,
                                                            dateString
                                                        )
                                                    }
                                                    placeholder={__(
                                                        'Select reminder date',
                                                        'quillcrm'
                                                    )}
                                                    className="h-12 flex-1"
                                                    buttonClassName="h-12 flex-1 bg-white border border-[#DEE1E6] rounded-[8px] text-[#09090B] font-normal"
                                                />
                                                {index === 0 ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 w-12 p-0 text-[#374151] border-[#374151]"
                                                        onClick={() =>
                                                            addReminder(0)
                                                        }
                                                    >
                                                        <PlusIcon />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 w-12 p-0 text-destructive border-destructive hover:text-destructive/80"
                                                        onClick={() =>
                                                            removeReminder(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <TrashIcon />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
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
                                : selectedCall
                                    ? __('Update Log Call', 'quillcrm')
                                    : __('Add Log Call', 'quillcrm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default CallDialog;
