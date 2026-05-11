/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { LimitBaseProps } from '@/types/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface EventBufferProps extends LimitBaseProps {
	type: 'buffer_before' | 'buffer_after';
	title: string;
}
const EventBuffer: React.FC<EventBufferProps> = ({
	limits,
	handleChange,
	type,
	title,
}) => {
	const value = limits.general[type] ?? 0;

	return (
        <div className='flex gap-2.5 flex-col mt-4'>
            <div className="text-[#09090B] text-[16px]">
				{title}
				<span className="text-red-500">*</span>
			</div>
            <Card className="rounded-lg py-2 booking-event-buffer-slider"><CardContent>
                    <div className="text-center text-sm text-muted-foreground mb-2">
                        {value > 0 && value < 120 ? `${value} ${__('Minutes', 'doublescale')}` : ''}
                    </div>
                    <Slider
                        value={[value]}
                        onValueChange={([newValue]) =>
                            handleChange('general', type, newValue)
                        }
                        step={5}
                        min={0}
                        max={120}
                    />
                </CardContent></Card>
        </div>
    );
};

export default EventBuffer;
