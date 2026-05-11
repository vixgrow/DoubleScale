/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 * */
import type { LimitBaseProps } from '@/types/booking';
import { SelectTimezone } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface SelectTimezoneProps extends LimitBaseProps {
	timeFormat: string;
}

const TimezoneSection: React.FC<SelectTimezoneProps> = ({
	limits,
	handleChange,
	timeFormat,
}) => {
	return (
        <Card className="mt-4"><CardContent>
                <div className='flex items-center justify-between px-[20px] mb-4'>
                    <div className='flex flex-col gap-[1px]'>
                        <div className="text-[#09090B] text-[20px] font-semibold">
                            {__('Lock time zone on booking page', 'doublescale')}
                        </div>
                        <div className="text-[#71717A] text-[14px]">
                            {__(
                                'To lock the timezone on booking page, useful for in-person events',
                                'doublescale'
                            )}
                        </div>
                    </div>
                    <Switch
                        checked={limits.timezone_lock.enable}
                        onCheckedChange={(checked) =>
                            handleChange('timezone_lock', 'enable', checked)
                        }
                        className={
                            limits.timezone_lock.enable
                                ? 'bg-primary'
                                : 'bg-gray-400'
                        }
                    />
                </div>
                {limits.timezone_lock.enable && (
                    <SelectTimezone
                        timezone={limits.timezone_lock.timezone}
                        handleChange={(value) =>
                            handleChange('timezone_lock', 'timezone', value)
                        }
                        timeFormat={timeFormat}
                    />
                )}
            </CardContent></Card>
    );
};

export default TimezoneSection;
