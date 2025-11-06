/**
 * Type definitions for Email Sequences module
 */

import { EmailTemplate } from '../../../types';

/**
 * Settings for sequence mail (stored in database)
 * Note: subject and email_body are handled by templates, not stored in settings
 */
export interface SequenceMailSettings {
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
    templates: EmailTemplate[];
}

/**
 * Form data for sequence mail modal (includes subject and email_body for UI)
 */
export interface SequenceMailFormData {
    subject: string;
    email_body: string;
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
    templates: EmailTemplate[];
}

/**
 * Data for email sequence
 */

export interface EmailSequenceData {
    name: string;
    fromName: string;
    fromEmail: string;
    replyToName: string;
    replyToEmail: string;
    setCustomFromNameAndEmail: boolean;
}

/**
 * Report data for sequence mail
 */
export interface SequenceMailReport extends SequenceMail {
    open_rate: number;
    click_rate: number;
    sent_rate: number;
    recipients: Array<{
        id: number;
        name: string;
        email: string;
        status: string;
        sent_at: string;
        opened_at?: string;
        clicked_at?: string;
    }>;
}

/**
 * Individual sequence mail (child of email sequence)
 */
export interface SequenceMail {
    id: number;
    name: string;
    description: string;
    status: string;
    subject: string;
    email_body: string;
    settings: SequenceMailSettings;
    parent_id: string;
    count: string;
    execute_at: string | null;
    created_at: string;
    updated_at: string;
    type: string;
    contacts_count: number;
    sent: number;
    opened: number;
    click: number;
}

/**
 * Email sequence (parent)
 */
export interface EmailSequence {
    id: number;
    name: string;
    description: string;
    status: string;
    subject: string;
    email_body: string;
    settings: any;
    parent_id: string;
    count: string;
    execute_at: string | null;
    created_at: string;
    updated_at: string;
    type: string;
    contacts_count: number;
    sequences_mail: SequenceMail[];
    sent: number;
    opened: number;
    click: number;
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
    click: number;
}


/**
 * Props for SequenceMailModal component
 */
export interface SequenceMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialData?: SequenceMailFormData;
    onSave: (data: SequenceMailFormData) => void;
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
    subject: string;
    email_body: string;
    description?: string;
    status?: string;
    settings: SequenceMailSettings;
}
