/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import { CURRENCY_OPTIONS } from '@/constants/currencies';

interface CurrenciesSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const CurrenciesSettings: React.FC<CurrenciesSettingsProps> = ({
    settings,
    onChange,
}) => {
    const { currency } = settings.currency || {};
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            currency: {
                ...settings.currency,
                [key]: value,
            },
        });
    };
    return (
        <div className="business-settings doublescale-fields">
            <div className="text-[#09090B] font-semibold text-2xl">{__('Currencies', 'doublescale')}</div>
            <Field
                label={__('Currency', 'doublescale')}
                value={currency || 'USD'}
                onChange={(value) => handleFieldChange('currency', value)}
                type="select"
                options={CURRENCY_OPTIONS}
                placeholder={__('Select a currency', 'doublescale')}
            />
        </div>
    );
};

export default CurrenciesSettings;

