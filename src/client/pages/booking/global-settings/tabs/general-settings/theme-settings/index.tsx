/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CardHeader, ThemeIcon } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ThemeSettings = ({ settings, updateSettings }) => {
	return (
        <Card><CardContent>
                <CardHeader
                    title={__('Theme', 'doublescale')}
                    description={__(
                        'This only applies to your public landing pages.',
                        'doublescale'
                    )}
                    icon={<ThemeIcon />}
                />
                <div className='flex mt-4'>
                    <RadioGroup
                        value={settings.color_scheme || 'system'}
                        onValueChange={(value) =>
                            updateSettings('color_scheme', value)
                        }
                        className="flex w-full justify-between gap-2"
                    >
                        {[
                            { value: 'system', label: __('System default', 'doublescale') },
                            { value: 'light', label: __('Light Mode', 'doublescale') },
                            { value: 'dark', label: __('Dark Mode', 'doublescale') },
                        ].map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 font-semibold cursor-pointer text-[#3F4254]"
                            >
                                <RadioGroupItem
                                    value={opt.value}
                                    className="custom-radio"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </RadioGroup>
                </div>
            </CardContent></Card>
    );
};

export default ThemeSettings;
