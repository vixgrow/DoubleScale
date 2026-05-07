/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';

interface CurrenciesSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'RUB', label: 'RUB - Russian Ruble' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    // Nigerian Naira
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'TRY', label: 'TRY - Turkish Lira' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
    { value: 'PLN', label: 'PLN - Polish Zloty' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
    { value: 'HUF', label: 'HUF - Hungarian Forint' },
    { value: 'CZK', label: 'CZK - Czech Koruna' },
    { value: 'ILS', label: 'ILS - Israeli Shekel' },
    { value: 'CLP', label: 'CLP - Chilean Peso' },
    { value: 'PHP', label: 'PHP - Philippine Peso' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'COP', label: 'COP - Colombian Peso' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'RON', label: 'RON - Romanian Leu' },
];

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
        <div className="business-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">{__('Currencies', 'doublescale')}</div>
            <Field
                label={__('Currency', 'doublescale')}
                value={currency || 'USD'}
                onChange={(value) => handleFieldChange('currency', value)}
                type="select"
                options={currencyOptions}
                placeholder={__('Select a currency', 'doublescale')}
            />
        </div>
    );
};

export default CurrenciesSettings;

