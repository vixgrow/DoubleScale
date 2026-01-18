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
    GradientAddMeetingIcon,
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

interface Meeting {
    id: number;
    contact_id: number;
    activity_type: string;
    data: {
        meeting_title?: string;
        duration?: number;
        location?: string;
        meeting_date_time?: string;
        meeting_end_time?: string;
        description?: string;
    };
    created_at: string;
    updated_at?: string;
}

interface MeetingDialogProps {
    open: boolean;
    onClose: () => void;
    contact_id: number;
    selectedMeeting: Meeting | null;
    onSave: (meeting: Meeting) => void;
    onUpdate: (meeting: Meeting) => void;
    showNotice: (type: 'success' | 'error', message: string) => void;
}

interface MeetingFormData {
    contactName: string;
    meetingTitle: string;
    duration: number;
    location: string;
    meetingDateTime: Date | null;
    description: string;
    createTask: boolean;
    dueDate: Date | null;
    setReminder: boolean;
    reminderDates: Date[];
}

const MeetingDialog: React.FC<MeetingDialogProps> = ({
    open,
    onClose,
    contact_id,
    selectedMeeting,
    onSave,
    onUpdate,
    showNotice,
}) => {
    const { contact } = useContactContext();
    const [formData, setFormData] = useState<MeetingFormData>({
        contactName: '',
        meetingTitle: '',
        duration: 60,
        location: '',
        meetingDateTime: new Date(),
        description: '',
        createTask: false,
        dueDate: null,
        setReminder: false,
        reminderDates: [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{
        meetingTitle?: string;
    }>({});

    useEffect(() => {
        if (selectedMeeting) {
            const meetingDate = selectedMeeting.data?.meeting_date_time
                ? new Date(selectedMeeting.data.meeting_date_time)
                : new Date(selectedMeeting.created_at);

            setFormData({
                contactName: contact ? `${contact.first_name} ${contact.last_name}`.trim() : '',
                meetingTitle: selectedMeeting.data?.meeting_title || '',
                duration: selectedMeeting.data?.duration || 60,
                location: selectedMeeting.data?.location || '',
                meetingDateTime: meetingDate,
                description: selectedMeeting.data?.description || '',
                createTask: false,
                dueDate: null,
                setReminder: false,
                reminderDates: [],
            });
        } else {
            setFormData({
                contactName: contact ? `${contact.first_name} ${contact.last_name}`.trim() : '',
                meetingTitle: '',
                duration: 60,
                location: '',
                meetingDateTime: new Date(),
                description: '',
                createTask: false,
                dueDate: null,
                setReminder: false,
                reminderDates: [],
            });
        }
        setErrors({});
    }, [selectedMeeting, open, contact]);

    const updateFormData = (updates: Partial<MeetingFormData>) => {
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
        const newErrors: { meetingTitle?: string } = {};

        if (!formData.meetingTitle.trim()) {
            newErrors.meetingTitle = __('Meeting title is required', 'quillcrm');
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
            const meetingData = {
                meeting_title: formData.meetingTitle.trim(),
                duration: formData.duration,
                location: formData.location || undefined,
                meeting_date_time: formData.meetingDateTime
                    ? dayjs(formData.meetingDateTime).format('YYYY-MM-DD HH:mm:ss')
                    : dayjs().format('YYYY-MM-DD HH:mm:ss'),
                description: formData.description.trim() || undefined,
            };

            if (selectedMeeting) {
                // Update existing meeting
                const response = (await apiFetch({
                    path: `/qc/v1/activities/${selectedMeeting.id}`,
                    method: 'PATCH',
                    data: {
                        meeting_data: meetingData,
                    },
                })) as Meeting;

                onUpdate(response);
                showNotice(
                    'success',
                    __('Meeting updated successfully', 'quillcrm')
                );
            } else {
                // Create new meeting
                const response = (await apiFetch({
                    path: `/qc/v1/activities/meetings`,
                    method: 'POST',
                    data: {
                        contact_id,
                        meeting_data: meetingData,
                    },
                })) as Meeting;

                onSave(response);
                showNotice(
                    'success',
                    __('Meeting scheduled successfully', 'quillcrm')
                );
            }

            onClose();
        } catch (error: any) {
            showNotice(
                'error',
                error.message || __('Failed to save meeting', 'quillcrm')
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
                                    selectedMeeting
                                        ? __('Edit Meeting', 'quillcrm')
                                        : __('Schedule Meeting', 'quillcrm')
                                }
                                subtitle={
                                    selectedMeeting
                                        ? __(
                                            'Update the meeting details',
                                            'quillcrm'
                                        )
                                        : __(
                                            'Schedule a new meeting for this contact',
                                            'quillcrm'
                                        )
                                }
                                icon={
                                    <GradientAddMeetingIcon
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Related Contact */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Contact Name', 'quillcrm')}
                                </Label>
                                <Input
                                    placeholder={__(
                                        'Enter contact name',
                                        'quillcrm'
                                    )}
                                    value={formData.contactName}
                                    disabled
                                    className="h-12"
                                />
                            </div>

                            {/* Meeting Title */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Meeting Title', 'quillcrm')}{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder={__(
                                        'Enter meeting title',
                                        'quillcrm'
                                    )}
                                    value={formData.meetingTitle}
                                    onChange={(e) => {
                                        updateFormData({ meetingTitle: e.target.value });
                                        if (errors.meetingTitle) {
                                            setErrors({
                                                ...errors,
                                                meetingTitle: undefined,
                                            });
                                        }
                                    }}
                                    className={`h-12 ${errors.meetingTitle ? 'border-red-500' : ''}`}
                                />
                                {errors.meetingTitle && (
                                    <p className="text-sm text-red-500">
                                        {errors.meetingTitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Duration */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Duration', 'quillcrm')}
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

                            {/* Location */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Location', 'quillcrm')}
                                </Label>
                                <Input
                                    placeholder={__(
                                        'Enter location',
                                        'quillcrm'
                                    )}
                                    value={formData.location}
                                    onChange={(e) =>
                                        updateFormData({ location: e.target.value })
                                    }
                                    className="h-12"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date & Time */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Date & Time', 'quillcrm')}
                                </Label>
                                <DateTimePicker
                                    value={formData.meetingDateTime}
                                    onChange={(date) =>
                                        updateFormData({ meetingDateTime: date })
                                    }
                                    placeholder={__(
                                        'Select date & time',
                                        'quillcrm'
                                    )}
                                    className="h-12"
                                />
                            </div>

                            {/* Meeting Description */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-base font-normal text-[#09090B]">
                                    {__('Meeting Description', 'quillcrm')}
                                </Label>
                                <Textarea
                                    placeholder={__(
                                        'Type Meeting agenda, topics to discuss....',
                                        'quillcrm'
                                    )}
                                    value={formData.description}
                                    onChange={(e) =>
                                        updateFormData({ description: e.target.value })
                                    }
                                    rows={4}
                                />
                            </div>
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
                                        'DD/MM/YYYY',
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
                                                        'DD/MM/YYYY',
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
                                : selectedMeeting
                                    ? __('Update Meeting', 'quillcrm')
                                    : __('Schedule Meeting', 'quillcrm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default MeetingDialog;
