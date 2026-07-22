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
import { BusinessLogoUpload } from '@/components/settings/business-logo-upload';

interface BusinessSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({
    settings,
    onChange,
}) => {
    const { business_name, business_address, business_logo } = settings.business;
    const handleFieldChange = (key: string, value: string) => {
        const nextBusiness = {
            ...settings.business,
            [key]: value,
        };
        onChange({
            ...settings,
            business: nextBusiness,
        });
        if (typeof window !== 'undefined' && window.doublescaleConfig) {
            window.doublescaleConfig.business = nextBusiness;
        }
    };
    return (
        <div className="business-settings doublescale-fields">
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
            <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                    {__('Business Logo', 'doublescale')}
                </div>
                <BusinessLogoUpload
                    value={business_logo || ''}
                    onChange={(url) => handleFieldChange('business_logo', url)}
                />
            </div>
        </div>
    );
};

export default BusinessSettings;
