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

interface BusinessSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({
    settings,
    onChange,
}) => {
    const { business_name, business_address } = settings.business;
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            business: {
                ...settings.business,
                [key]: value,
            },
        });
    };
    return (
        <div className="business-settings qcrm-fields">
            <Field
                label={__('Business Name', 'quillcrm')}
                value={business_name || ConfigAPI.getBlogName()}
                onChange={(value) => handleFieldChange('business_name', value)}
                type="text"
            />
            <Field
                label={__('Business Address', 'quillcrm')}
                value={business_address}
                onChange={(value) =>
                    handleFieldChange('business_address', value)
                }
                type="textarea"
            />
        </div>
    );
};

export default BusinessSettings;

