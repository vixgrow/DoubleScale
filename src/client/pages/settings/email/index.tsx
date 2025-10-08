/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field, TinyMCEWPEditor } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import { Label } from '@quillcrm/components/ui/label';

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
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('Email', 'quillcrm')}
            </div>
            <div className="flex gap-5 items-center mb-3">
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
            </div>
            <div className="flex gap-5 items-start w-full">
                <div className="w-full flex flex-col gap-5">
                    <Field
                        label={__('Max Emails in Second', 'quillcrm')}
                        value={max_in_second}
                        onChange={(value) =>
                            handleFieldChange('max_in_second', value)
                        }
                        type="slider"
                        min={0}
                        max={1500}
                    />
                    <Field
                        label={__('Max Emails in Day', 'quillcrm')}
                        value={max_in_day}
                        onChange={(value) =>
                            handleFieldChange('max_in_day', value)
                        }
                        type="slider"
                        min={0}
                        max={1000}
                    />
                </div>
                <div className="w-full">
                    <Label className="text-[#09090B] font-normal text-base">
                        {__('Email Footer', 'quillcrm')}
                    </Label>
                    <div className="mt-2">
                        <TinyMCEWPEditor
                            value={email_footer}
                            onChange={(content) =>
                                handleFieldChange('email_footer', content)
                            }
                            height={132}
                            toolbar="bold italic underline strikethrough align bullist numlist link image mergetags"
                            plugins={[
                                'advlist',
                                'lists',
                                'link',
                            ]}
                            init={{
                                toolbar_mode: 'scrolling',
                            }}
                            placeholder={__('Enter email footer content...', 'quillcrm')}
                            showMergeTags={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;
