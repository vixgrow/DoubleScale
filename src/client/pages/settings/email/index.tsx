/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';

interface EmailSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({
    settings,
    onChange,
}) => {
    const {
        from_name,
        from_email,
        reply_to,
        email_footer,
        max_in_second,
        max_in_day,
    } = settings.email;
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            email: {
                ...settings.email,
                [key]: value,
            },
        });
    };
    return (
        <div className="email-settings qcrm-fields">
            <Field
                label={__('From Name', 'quillcrm')}
                value={from_name || ConfigAPI.getBlogName()}
                onChange={(value) => handleFieldChange('from_name', value)}
                type="text"
            />
            <Field
                label={__('From Email', 'quillcrm')}
                value={from_email || ConfigAPI.getBlogName()}
                onChange={(value) => handleFieldChange('from_email', value)}
                type="email"
            />
            <Field
                label={__('Reply To', 'quillcrm')}
                value={reply_to || ConfigAPI.getBlogName()}
                onChange={(value) => handleFieldChange('reply_to', value)}
                type="email"
            />
            <Field
                label={__('Email Footer', 'quillcrm')}
                value={email_footer}
                onChange={(value) => handleFieldChange('email_footer', value)}
                type="textarea"
            />
            <Field
                label={__('Max Emails in Second', 'quillcrm')}
                value={max_in_second}
                onChange={(value) => handleFieldChange('max_in_second', value)}
                type="number"
            />
            <Field
                label={__('Max Emails in Day', 'quillcrm')}
                value={max_in_day}
                onChange={(value) => handleFieldChange('max_in_day', value)}
                type="number"
            />
        </div>
    );
};

export default EmailSettings;

