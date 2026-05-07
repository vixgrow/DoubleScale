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

    return (
        <div className="double-optin-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('Double Optin', 'doublescale')}
            </div>
            <div className="flex gap-5 items-start pb-5 border-b">
                <div className="w-full">
                    <Field
                        label={__('Email Subject', 'doublescale')}
                        value={email_subject}
                        onChange={(value) =>
                            handleFieldChange('email_subject', value)
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
                                handleFieldChange('email_content', content)
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-5 items-start w-full">
                <div className="w-full">
                    <div className="qcrm-field">
                        <div className="qcrm-field-label text-[#09090B] font-normal text-base">
                            {__('After Confirmation', 'doublescale')}
                        </div>
                        <RadioGroup
                            value={after_confirmation}
                            onValueChange={(value) =>
                                handleFieldChange('after_confirmation', value)
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
                                        handleFieldChange('confirmation_message', content)
                                    }
                                />
                            </div>
                        </>
                    ) : (
                        <Field
                            label={__('Confirmation Redirect', 'doublescale')}
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
