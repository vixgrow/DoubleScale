/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { IoChevronUp } from 'react-icons/io5';
import { LuClock5 } from 'react-icons/lu';
/**
 * Internal dependencies
 */
import type { Location } from '@/types/booking';
import user from '@/components/booking/icons/user.png';
import { Card, CardContent } from '@/components/ui/card';

interface LivePreviewProps {
	name: string;
	hosts: { id: number | string; name: string }[];
	duration: number;
	locations: Location[];
	color: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({
	name,
	hosts,
	duration,
	locations,
	color,
}) => {
	return (
		<Card
			className="rounded-lg shadow-none border-[#e5e7eb] border-[0.1px]"
			styles={{ body: { padding: 0 } }}
		><CardContent>
				<div
					className='flex justify-between items-center px-[30px] py-5'
					style={{ backgroundColor: color }}
				>
					<div className="text-white text-[24px] font-[700]">
						{__('Event Live Preview', 'doublescale')}
					</div>
					<IoChevronUp className="text-white text-[16px]" />
				</div>
				<div className='flex flex-col gap-2.5 px-[30px] py-5'>
					<div className='flex justify-between items-start'>
						<div className='flex flex-col gap-1'>
							{/* static */}
							<div>
								<img
									src={user}
									alt="user.png"
									className="size-16 rounded-full"
								/>
							</div>
							<div className="text-[#1A1A1A99] text-[16px]">
								{hosts.map((host, index) => (
									<span key={index}>
										{host.name}
										{index !== hosts.length - 1 && ', '}
									</span>
								))}
							</div>
							<div className="text-[#1A1A1A] text-[24px]">
								{name}
							</div>
						</div>
						{/* <Flex
							gap={4}
							className="text-primary text-[16px] font-semibold items-center"
						>
							<CiShare1 className="text-[20px]" />
							<span>{__('Event Link', 'doublescale')}</span>
						</Flex> */}
					</div>
					<div className='flex gap-1 text-[#1A1A1A99] text-[16px] items-center'>
						<LuClock5 className="text-[20px]" />
						<span>
							{duration} {__('min', 'doublescale')}
						</span>
					</div>
					<span className="text-[16px] text-[#1A1A1A99] font-[500] capitalize">
						{locations?.map((loc, index) => (
							<span key={index}>
								{loc.type === 'custom'
									? loc.fields?.location
									: loc.type?.split('_').join(' ')}
								{index !== locations.length - 1 && ' | '}
							</span>
						))}
					</span>
					<div className="text-[16px] text-[#1A1A1A] pb-4">
						{__(
							'This is an example of a meeting you would have with a potential customer to demonstrate your product.',
							'doublescale'
						)}
					</div>
				</div>
			</CardContent></Card>
	);
};

export default LivePreview;
