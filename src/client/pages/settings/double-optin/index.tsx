/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
import { RadioGroup, RadioGroupItem } from '@quillcrm/components/ui/radio-group';
import { Label } from '@quillcrm/components/ui/label';

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
            double_optin: {
                ...settings.double_optin,
                [key]: value,
            },
        });
    };
    console.log(settings);

    return (
        <div className="double-optin-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('Double Optin', 'quillcrm')}
            </div>
            <div className="flex gap-5 items-center pb-5 border-b">
                <Field
                    label={__('Email Subject', 'quillcrm')}
                    value={email_subject}
                    onChange={(value) =>
                        handleFieldChange('email_subject', value)
                    }
                    type="text"
                />
                <Field
                    label={__('Email Content', 'quillcrm')}
                    value={email_content}
                    onChange={(value) =>
                        handleFieldChange('email_content', value)
                    }
                    type="textarea"
                />
            </div>
            <div className="flex gap-5 items-start w-full">
                <div className="w-full">
                    <div className="qcrm-field">
                        <div className="qcrm-field-label text-[#09090B] font-normal text-base">
                            {__('After Confirmation', 'quillcrm')}
                        </div>
                        <RadioGroup
                            value={after_confirmation}
                            onValueChange={(value) =>
                                handleFieldChange('after_confirmation', value)
                            }
                        >
                            <div className="flex gap-7">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="message" id="radio-message" />
                                    <Label htmlFor="radio-message" className="font-normal cursor-pointer">
                                        {__('Show Message', 'quillcrm')}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="url" id="radio-url" />
                                    <Label htmlFor="radio-url" className="font-normal cursor-pointer">
                                        {__('Redirect to URL', 'quillcrm')}
                                    </Label>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="w-full">
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
            </div>
        </div>
    );
};

export default DoubleOptInSettings;
