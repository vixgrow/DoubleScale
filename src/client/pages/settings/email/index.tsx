/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field, Editor } from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import ConfigAPI from '@doublescale/config';
import { FromEmailSelector } from '@/components/from-email-selector';

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
        <div className="email-settings doublescale-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('Email', 'doublescale')}
            </div>
            <div className="flex gap-5 items-start mb-3">
                <div className="flex-1">
                    <Field
                        label={__('From Name', 'doublescale')}
                        value={from_name || ConfigAPI.getBlogName()}
                        onChange={(value) => handleFieldChange('from_name', value)}
                        type="text"
                    />
                </div>
                <div className="flex-1">
                    <div className="doublescale-field-label text-[#09090B] font-normal text-base flex items-center justify-between mb-[10px]">
                        {__('From Email', 'doublescale')}
                    </div>
                    <div className="doublescale-field-input">
                        <FromEmailSelector
                            value={from_email || ConfigAPI.getAdminEmail()}
                            onChange={(email, name) => {
                                handleFieldChange('from_email', email);
                                // Auto-fill from name if provided and current from_name is empty
                                if (name && !from_name) {
                                    handleFieldChange('from_name', name);
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <Field
                        label={__('Reply To', 'doublescale')}
                        value={reply_to || ConfigAPI.getBlogName()}
                        onChange={(value) => handleFieldChange('reply_to', value)}
                        type="email"
                    />
                </div>
            </div>
            <div className="flex gap-5 items-start w-full">
                <div className="w-full flex flex-col gap-5">
                    <Field
                        label={__('Max Emails in Second', 'doublescale')}
                        value={max_in_second}
                        onChange={(value) =>
                            handleFieldChange('max_in_second', value)
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
			{/* Note: Bounce Handler section removed - only available in Pro plugin */}
        </div>
    );
};

export default EmailSettings;
