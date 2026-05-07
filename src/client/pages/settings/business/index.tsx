/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import ConfigAPI from '@doublescale/config';

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
            <div className="text-[#09090B] font-semibold text-2xl">{__('Business', 'doublescale')}</div>
            <Field
                label={__('Business Name', 'doublescale')}
                value={business_name || ConfigAPI.getBlogName()}
                onChange={(value) => handleFieldChange('business_name', value)}
                type="text"
            />
            <Field
                label={__('Business Address', 'doublescale')}
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

