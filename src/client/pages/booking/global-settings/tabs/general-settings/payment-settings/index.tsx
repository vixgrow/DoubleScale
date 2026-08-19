/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CardHeader,
	GeneralSettingsPaymentIcon,
} from '@/components/booking';
import { CURRENCY_OPTIONS } from '@/constants/currencies';

import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PaymentSettings = ({ settings, updateSettings }) => {

	return (
        <Card><CardContent>
                <CardHeader
                    title={__('Payment Settings', 'doublescale')}
                    description={__(
                        'Configure your global payment settings for booking related payments',
                        'doublescale'
                    )}
                    icon={<GeneralSettingsPaymentIcon />}
                />
                <div className='flex flex-col gap-5 mt-4'>
                    <div className='flex flex-col gap-1'>
                        <div className="font-semibold text-[16px]">
                            {__('Payment Module', 'doublescale')}
                        </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('Currency', 'doublescale')}
                        </div>
                        <Select
                            value={settings.currency || 'USD'}
                            onValueChange={(value) =>
                                updateSettings('currency', value)
                            }
                        >
                            <SelectTrigger className="h-[48px] rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCY_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent></Card>
    );
};

export default PaymentSettings;
