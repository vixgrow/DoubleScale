/**
 * Type definitions for Email Sequences module
 */

/**
 * Settings for sequence mail
 */
export interface SequenceMailSettings {
    subject: string;
    pre_header: string;
    delay: {
        value: number;
        unit: string;
    };
    sending_time_range: {
        from: string;
        to: string;
    };
    enable_specific_days: boolean;
    days: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
    add_utm_parameters: boolean;
    utm_parameters: {
        campaign_source: string;
        campaign_medium: string;
        campaign_name: string;
        campaign_term: string;
        campaign_content: string;
    };
    email_body: string;
}

/**
 * Individual sequence mail (child of email sequence)
 */
export interface SequenceMail {
    id: number;
    name: string;
    description: string;
    status: string;
    settings: SequenceMailSettings;
    parent_id: string;
    count: string;
    execute_at: string | null;
    created_at: string;
    updated_at: string;
    type: string;
    contacts_count: number;
}

/**
 * Email sequence (parent)
 */
export interface EmailSequence {
    id: number;
    name: string;
    description: string;
    status: string;
    settings: any;
    parent_id: string;
    count: string;
    execute_at: string | null;
    created_at: string;
    updated_at: string;
    type: string;
    contacts_count: number;
    sequences_mail: SequenceMail[];
}

/**
 * Email sequence list response
 */
export interface EmailSequenceListResponse {
    data: EmailSequence[];
    total: number;
    total_count: number;
}

/**
 * Stats for sequence mail
 */
export interface SequenceMailStats {
    sent: number | string;
    opened: number;
    clicked: number;
    unsubscribed: number;
}


/**
 * Props for SequenceMailModal component
 */
export interface SequenceMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialData?: SequenceMailSettings;
    onSave: (data: SequenceMailSettings) => void;
}

/**
 * Props for AddSequenceMail component
 */
export interface AddSequenceMailProps {
    isAdding: boolean;
    setIsAdding: (value: boolean) => void;
    sequenceId: string | number;
    onSuccess: () => void;
}

/**
 * Props for EditSequenceMail component
 */
export interface EditSequenceMailProps {
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    sequenceId: string | number;
    emailId: number;
    onSuccess: () => void;
}

/**
 * API request for creating/updating sequence mail
 */
export interface SequenceMailRequest {
    type: string;
    parent_id: string | number;
    name: string;
    description?: string;
    status?: string;
    settings: SequenceMailSettings;
}
