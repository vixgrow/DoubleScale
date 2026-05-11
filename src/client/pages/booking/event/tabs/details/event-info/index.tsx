/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
/**
 * Internal dependencies
 */

import {
	CardHeader,
	ColorSelector,
	EventInfoIcon,
} from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EventInfoProps {
	name: string;
	description?: string | null;
	color: string;
	onChange: (key: string, value: any) => void;
}

const EventInfo: React.FC<EventInfoProps> = ({
	name,
	description,
	color,
	onChange,
}) => {
	return (
        <Card className="rounded-lg"><CardContent>
                <CardHeader
                    title={__('Event Details', 'doublescale')}
                    description={__(
                        'Set your Event Name and Event Host.',
                        'doublescale'
                    )}
                    icon={<EventInfoIcon />}
                />
                <div className='flex flex-col border-b pb-4'>
                    <div className='flex gap-[1px] flex-col mt-4'>
                        <div className="text-[#09090B] text-[16px]">
                            {__('Event Calendar Name', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </div>
                        <Input
                            value={name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={__(
                                'Enter name of this event calendar',
                                'doublescale'
                            )}
                            className="h-[48px] rounded-lg"
                        />
                    </div>
                    <div className='flex gap-[1px] flex-col mt-4'>
                        <div className="text-[#09090B] text-[16px]">
                            {__('Description', 'doublescale')}
                        </div>
                        <Textarea
                            value={description || ''}
                            onChange={(e) =>
                                onChange('description', e.target.value)
                            }
                            placeholder={__(
                                'type your Description',
                                'doublescale'
                            )}
                            rows={4}
                            className="rounded-lg"
                        />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <div className='flex gap-[1px] flex-col mt-4'>
                        <div className="text-[#09090B] text-[16px]">
                            {__('Event Color', 'doublescale')}
                        </div>
                        <div className="flex flex-wrap gap-4 place-items-center mt-2">
                            <ColorSelector
                                selectedColor={color || null}
                                onColorSelect={(color) => onChange('color', color)}
                            />
                        </div>
                    </div>
                </div>
            </CardContent></Card>
    );
};

export default EventInfo;
