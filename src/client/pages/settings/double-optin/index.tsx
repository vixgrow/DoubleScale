/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';

interface DoubleOptInSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const DoubleOptInSettings: React.FC<DoubleOptInSettingsProps> = ({
    settings,
    onChange,
}) => {
    const {
        email_subject,
        email_content,
        after_confirmation,
        confirmation_message,
        confirmation_redirect,
    } = settings.double_optin;
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            [key]: value,
        });
    };
    console.log(settings);

    return (
        <div className="double-optin-settings qcrm-fields">
            <Field
                label={__('Email Subject', 'quillcrm')}
                value={email_subject}
                onChange={(value) => handleFieldChange('email_subject', value)}
                type="text"
            />
            <Field
                label={__('Email Content', 'quillcrm')}
                value={email_content}
                onChange={(value) => handleFieldChange('email_content', value)}
                type="textarea"
            />
            <Field
                label={__('After Confirmation', 'quillcrm')}
                value={after_confirmation}
                onChange={(value) =>
                    handleFieldChange('after_confirmation', value)
                }
                type="select"
                options={[
                    { label: __('Redirect to URL', 'quillcrm'), value: 'url' },
                    { label: __('Show Message', 'quillcrm'), value: 'message' },
                ]}
            />
            {after_confirmation === 'message' ? (
                <Field
                    label={__('Confirmation Message', 'quillcrm')}
                    value={confirmation_message}
                    onChange={(value) =>
                        handleFieldChange('confirmation_message', value)
                    }
                    type="textarea"
                />
            ) : (
                <Field
                    label={__('Confirmation Redirect', 'quillcrm')}
                    value={confirmation_redirect}
                    onChange={(value) =>
                        handleFieldChange('confirmation_redirect', value)
                    }
                    type="text"
                />
            )}
        </div>
    );
};

export default DoubleOptInSettings;

