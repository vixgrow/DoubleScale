/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CardHeader, AdvancedSettingsIcon } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const GeneralSettingsCard = ({ settings, updateSettings }) => {
	const getTimeOptions = () => {
		const options: { value: number; label: string }[] = [];

		// 10 to 50 minutes
		for (let i = 10; i <= 50; i += 10) {
			options.push({
				value: i,
				label: `${i} ${__('minutes', 'doublescale')}`,
			});
		}

		// 1 to 12 hours
		for (let i = 1; i <= 12; i++) {
			options.push({
				value: i * 60,
				label: `${i} ${i === 1 ? __('hour', 'doublescale') : __('hours', 'doublescale')}`,
			});
		}

		// 1 to 2 days
		for (let i = 1; i <= 2; i++) {
			options.push({
				value: i * 24 * 60,
				label: `${i} ${i === 1 ? __('day', 'doublescale') : __('days', 'doublescale')}`,
			});
		}

		return options;
	};

	// Country code options simplified
	const countryOptions = [
		{ value: 'US', label: 'United States (+1)' },
		{ value: 'GB', label: 'United Kingdom (+44)' },
		{ value: 'IN', label: 'India (+91)' },
		{ value: 'DE', label: 'Germany (+49)' },
		{ value: 'FR', label: 'France (+33)' },
		{ value: 'JP', label: 'Japan (+81)' },
		{ value: 'CN', label: 'China (+86)' },
		{ value: 'RU', label: 'Russia (+7)' },
		{ value: 'AU', label: 'Australia (+61)' },
		{ value: 'BR', label: 'Brazil (+55)' },
		{ value: 'IT', label: 'Italy (+39)' },
		{ value: 'CA', label: 'Canada (+1)' },
		{ value: 'MX', label: 'Mexico (+52)' },
	];

	// Day options
	const dayOptions = [
		{ value: 'sunday', label: __('Sunday', 'doublescale') },
		{ value: 'monday', label: __('Monday', 'doublescale') },
		{ value: 'tuesday', label: __('Tuesday', 'doublescale') },
		{ value: 'wednesday', label: __('Wednesday', 'doublescale') },
		{ value: 'thursday', label: __('Thursday', 'doublescale') },
		{ value: 'friday', label: __('Friday', 'doublescale') },
		{ value: 'saturday', label: __('Saturday', 'doublescale') },
	];

	// Frequency options
	const frequencyOptions = [
		{ value: 'daily', label: __('Daily', 'doublescale') },
		{ value: 'weekly', label: __('Weekly', 'doublescale') },
		{ value: 'monthly', label: __('Monthly', 'doublescale') },
	];

	return (
        <Card><CardContent>
                <CardHeader
                    title={__('General Settings', 'doublescale')}
                    description={__(
                        'Manage your settings related emails, notifications and other general settings',
                        'doublescale'
                    )}
                    icon={<AdvancedSettingsIcon />}
                />
                <div className='flex flex-col gap-[25px] mt-4'>
                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('Calendar Start From', 'doublescale')}
                        </div>
                        <Select
                            value={settings.start_from || 'monday'}
                            onValueChange={(value) =>
                                updateSettings('start_from', value)
                            }
                        >
                            <SelectTrigger className="h-[48px] rounded-lg">
                                <SelectValue
                                    placeholder={__(
                                        'Select a day',
                                        'doublescale'
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {dayOptions.map((opt) => (
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

                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('Default Time Format', 'doublescale')}
                        </div>
                        <RadioGroup
                            value={settings.time_format || '12'}
                            onValueChange={(value) =>
                                updateSettings('time_format', value)
                            }
                            className="flex w-full gap-2"
                        >
                            {[
                                { value: '12', label: __('12h', 'doublescale') },
                                { value: '24', label: __('24h', 'doublescale') },
                            ].map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-2 border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] ${
                                        settings.time_format === opt.value
                                            ? 'bg-secondary border-primary'
                                            : 'border'
                                    }`}
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

                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__(
                                'Mark booking as cancelled automatically after',
                                'doublescale'
                            )}
                        </div>
                        <Select
                            value={String(settings.auto_cancel_after || 60)}
                            onValueChange={(value) =>
                                updateSettings(
                                    'auto_cancel_after',
                                    Number(value)
                                )
                            }
                        >
                            <SelectTrigger className="h-[48px] rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {getTimeOptions().map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-[#818181]">
                            {__(
                                'if customer does not complete the payment for paid events.',
                                'doublescale'
                            )}
                        </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__(
                                'Mark booking as completed automatically after',
                                'doublescale'
                            )}
                        </div>
                        <Select
                            value={String(settings.auto_complete_after || 120)}
                            onValueChange={(value) =>
                                updateSettings(
                                    'auto_complete_after',
                                    Number(value)
                                )
                            }
                        >
                            <SelectTrigger className="h-[48px] rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {getTimeOptions().map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-[#818181]">
                            {__('from the event end time', 'doublescale')}
                        </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                        <div className="text-[#3F4254] font-semibold text-[16px]">
                            {__('Default Country Code', 'doublescale')}
                        </div>
                        <Select
                            value={(
                                settings.default_country_code || 'US'
                            ).toUpperCase()}
                            onValueChange={(value) =>
                                updateSettings('default_country_code', value)
                            }
                        >
                            <SelectTrigger className="h-[48px] rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {countryOptions.map((opt) => (
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

                    {/* <Flex vertical gap={4}>
                        <div className="font-semibold text-[16px]">
                            {__('Summary Email', 'doublescale')}
                        </div>
                        <Checkbox
                            className="custom-check text-[#3F4254] font-semibold"
                            checked={settings.enable_summary_email || false}
                            onChange={(e) =>
                                updateSettings(
                                    'enable_summary_email',
                                    e.target.checked
                                )
                            }
                        >
                            {__(
                                'Enable Booking Summary Notification.',
                                'doublescale'
                            )}
                        </Checkbox>
                    </Flex> */}

                    {settings.enable_summary_email && (
                        <div className='flex flex-col gap-1'>
                            <div className="text-[#3F4254] font-semibold text-[16px]">
                                {__('Email Frequency?', 'doublescale')}
                            </div>
                            <Select
                                value={
                                    settings.summary_email_frequency || 'daily'
                                }
                                onValueChange={(value) =>
                                    updateSettings(
                                        'summary_email_frequency',
                                        value
                                    )
                                }
                            >
                                <SelectTrigger className="h-[48px] rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map((opt) => (
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
                    )}

                    {/* @tier free — booking confirmation email content control. */}
                    <div className='flex items-start justify-between gap-4 pt-2 border-t'>
                        <div className='flex-1'>
                            <Label className='text-[#3F4254] font-semibold text-[16px]'>
                                {__('Attach calendar invite (.ics)', 'doublescale')}
                            </Label>
                            <p className='text-xs text-gray-500 mt-1'>
                                {__('Adds a downloadable .ics file to confirmation emails so attendees can save the booking to their calendar.', 'doublescale')}
                            </p>
                        </div>
                        <Switch
                            checked={!!settings.include_ics}
                            onCheckedChange={(checked) =>
                                updateSettings('include_ics', checked)
                            }
                        />
                    </div>
                </div>
            </CardContent></Card>
    );
};

export default GeneralSettingsCard;
