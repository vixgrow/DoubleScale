/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import { CopyWhiteIcon } from '@/components/booking';
import { useCopyToClipboard, useApi } from '@/hooks/booking';
import type { Event, Service } from '@/types/booking';
import type { ShareEntityType } from '../index';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ShortCode: React.FC<{
	event?: Event;
	service?: Service;
	entityType?: ShareEntityType;
	icon: React.ReactNode;
	title: string;
}> = ({ event, service, entityType = 'event', icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();
	const [shortCode, setShortCode] = useState({
		width: { value: 100, unit: '%' },
		minHeight: { value: 500, unit: 'Px' },
		maxHeight: { value: 0, unit: 'Auto' },
	});
	const handleSizeChange = (field, value, unit) => {
		setShortCode((prev) => ({
			...prev,
			[field]: { value, unit },
		}));
	};
	const generateShortcode = () => {
		const width =
			shortCode.width.unit === 'Auto'
				? 'Auto'
				: `${shortCode.width.value}${shortCode.width.unit}`;
		const minHeight =
			shortCode.minHeight.unit === 'Auto'
				? 'Auto'
				: `${shortCode.minHeight.value}${shortCode.minHeight.unit}`;
		const maxHeight =
			shortCode.maxHeight.unit === 'Auto'
				? 'Auto'
				: `${shortCode.maxHeight.value}${shortCode.maxHeight.unit}`;

		if (entityType === 'services') {
			return `[doublescale_booking_services width="${width}" min_height="${minHeight}" max_height="${maxHeight}"]`;
		}

		if (entityType === 'service' && service) {
			return `[doublescale_booking_service id="${service.id}" width="${width}" min_height="${minHeight}" max_height="${maxHeight}"]`;
		}

		return `[doublescale_booking id="${event?.id}" width="${width}" min_height="${minHeight}" max_height="${maxHeight}"]`;
	};

	return (
        <>
            {/* static */}
            <div className='flex gap-2.5 items-start sm:items-center border-b pb-4 border-[#E4E4E4] min-w-0'>
				<div className="shrink-0 rounded-lg p-2 border border-secondary">
					{icon}
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-[#09090B] text-[16px] sm:text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__(
							'Customize your form display settings and copy the generated shortcode.',
							'doublescale'
						)}
					</span>
				</div>
			</div>
            <Card className="mt-5"><CardContent>
                    <div className='flex flex-col gap-5'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                            <span className="text-[#1E2125] text-[16px] font-[700] shrink-0">
                                {__('Width', 'doublescale')}
                            </span>
                            <div className='flex gap-2 sm:gap-[18px] min-w-0'>
                                <Input
                                    className="h-[48px] rounded-lg w-full sm:w-[132px]"
                                    placeholder="100"
                                    value={shortCode.width.value}
                                    onChange={(e) =>
                                        handleSizeChange(
                                            'width',
                                            e.target.value,
                                            shortCode.width.unit
                                        )
                                    }
                                    type="number"
                                />
                                <Select
                                    defaultValue={shortCode.width.unit}
                                    onValueChange={(unit) =>
                                        handleSizeChange(
                                            'width',
                                            shortCode.width.value,
                                            unit
                                        )
                                    } />
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                            <span className="text-[#1E2125] text-[16px] font-[700] shrink-0">
                                {__('Minimum Height', 'doublescale')}
                            </span>
                            <div className='flex gap-2 sm:gap-[18px] min-w-0'>
                                <Input
                                    className="h-[48px] rounded-lg w-full sm:w-[132px]"
                                    placeholder="100"
                                    value={shortCode.minHeight.value}
                                    onChange={(e) =>
                                        handleSizeChange(
                                            'minHeight',
                                            e.target.value,
                                            shortCode.minHeight.unit
                                        )
                                    }
                                    type="number"
                                />
                                <Select
                                    defaultValue={shortCode.minHeight.unit}
                                    onValueChange={(unit) =>
                                        handleSizeChange(
                                            'minHeight',
                                            shortCode.minHeight.value,
                                            unit
                                        )
                                    } />
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                            <span className="text-[#1E2125] text-[16px] font-[700] shrink-0">
                                {__('Maximum Height', 'doublescale')}
                            </span>
                            <div className='flex gap-2 sm:gap-[18px] min-w-0'>
                                <Input
                                    className="h-[48px] rounded-lg w-full sm:w-[132px]"
                                    placeholder="100"
                                    value={shortCode.maxHeight.value}
                                    onChange={(e) =>
                                        handleSizeChange(
                                            'maxHeight',
                                            e.target.value,
                                            shortCode.maxHeight.unit
                                        )
                                    }
                                    type="number"
                                />
                                <Select
                                    defaultValue={shortCode.maxHeight.unit}
                                    onValueChange={(unit) =>
                                        handleSizeChange(
                                            'maxHeight',
                                            shortCode.maxHeight.value,
                                            unit
                                        )
                                    } />
                            </div>
                        </div>
                    </div>
                </CardContent></Card>
            <div className='flex flex-col pt-4'>
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__('Generated Shortcode', 'doublescale')}
				</div>
				<div className='flex flex-col sm:flex-row gap-2.5 min-w-0'>
					<Input
						value={generateShortcode()}
						readOnly
						className="h-[48px] min-w-0 flex-1 text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-primary h-[48px] w-full sm:w-auto shrink-0 px-7 rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								generateShortcode(),
								__('Link copied', 'doublescale')
							)
						}
						disabled
					>
						<CopyWhiteIcon />
						<span className="text-white text-[16px] font-[500] self-center">
							{__('Copy', 'doublescale')}
						</span>
					</Button>
				</div>
			</div>
        </>
    );
};

export default ShortCode;
