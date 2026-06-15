/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field, Editor } from '@doublescale/components';
import { RadioGroup, RadioGroupItem } from '@doublescale/components/ui/radio-group';
import { Label } from '@doublescale/components/ui/label';

interface EmailSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const ProEmailSettings: React.FC<EmailSettingsProps> = ({
    settings,
    onChange,
}) => {
    const {
        email_footer,
        max_in_second,
        max_in_day,
    } = settings.email;

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
            email: {
                ...settings.email,
                [key]: value,
            },
        });
    };

    const handleOptInChange = (key: string, value: string) => {
        onChange({
            ...settings,
            double_optin: {
                ...settings.double_optin,
                [key]: value,
            },
        });
    };

    return (
        <div className="email-settings doublescale-fields">
            <div className="text-foreground font-semibold text-2xl">
                {__('Email', 'doublescale')}
            </div>
            <div className="flex flex-col sm:flex-row gap-5 items-start pb-5 border-b">
                <div className="w-full flex flex-row sm:flex-col gap-5">
                    <Field
                        label={__('Max Emails in Second', 'doublescale')}
                        value={max_in_second}
                        onChange={(value) =>
                            handleFieldChange('max_in_second', value)
                        }
                        type="number"
                        min={1}
                    />
                    <Field
                        label={__('Max Emails in Day', 'doublescale')}
                        value={max_in_day}
                        onChange={(value) =>
                            handleFieldChange('max_in_day', value)
                        }
                        type="number"
                        min={1}
                    />
                </div>
                <div className="w-full">
                    <div className="text-[#09090B] font-normal text-base mb-2">
                        {__('Email Footer', 'doublescale')}
                    </div>
                    <div>
                        <Editor
                            message={email_footer}
                            onChange={(content) =>
                                handleFieldChange('email_footer', content)
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Double Opt-In */}
            <div className="text-foreground font-semibold text-2xl ">
                {__('Double Opt-In', 'doublescale')}
            </div>
            <div className="flex gap-5 flex-col sm:flex-row items-start pb-5 border-b">
                <div className="w-full flex flex-row sm:flex-col gap-5">
                    <Field
                        label={__('Email Subject', 'doublescale')}
                        value={email_subject}
                        onChange={(value) =>
                            handleOptInChange('email_subject', value)
                        }
                        type="text"
                    />
                </div>
                <div className="w-full">
                    <Label className="text-[#09090B] font-normal text-base">
                        {__('Email Content', 'doublescale')}
                    </Label>
                    <div className="mt-2">
                        <Editor
                            message={email_content}
                            onChange={(content) =>
                                handleOptInChange('email_content', content)
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-5 flex-col sm:flex-row items-start w-full">
                <div className="w-full flex flex-row sm:flex-col gap-5">
                    <div className="doublescale-field">
                        <div className="doublescale-field-label text-foreground font-semibold text-2xl">
                            {__('After Confirmation', 'doublescale')}
                        </div>
                        <RadioGroup
                            value={after_confirmation}
                            onValueChange={(value) =>
                                handleOptInChange('after_confirmation', value)
                            }
                        >
                            <div className="flex gap-5">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="message" id="radio-message" />
                                    <Label htmlFor="radio-message" className="font-normal cursor-pointer">
                                        {__('Show Message', 'doublescale')}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="url" id="radio-url" />
                                    <Label htmlFor="radio-url" className="font-normal cursor-pointer">
                                        {__('Redirect to URL', 'doublescale')}
                                    </Label>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="w-full">
                    {after_confirmation === 'message' ? (
                        <>
                            <Label className="text-[#09090B] font-normal text-base">
                                {__('Confirmation Message', 'doublescale')}
                            </Label>
                            <div className="mt-2">
                                <Editor
                                    message={confirmation_message}
                                    onChange={(content) =>
                                        handleOptInChange('confirmation_message', content)
                                    }
                                />
                            </div>
                        </>
                    ) : (
                        <Field
                            label={__('Confirmation Redirect', 'doublescale')}
                            value={confirmation_redirect}
                            onChange={(value) =>
                                handleOptInChange('confirmation_redirect', value)
                            }
                            type="text"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProEmailSettings;

