import React from 'react';
import { __ } from '@wordpress/i18n';
import type { ExtendedLocation } from '../types';
import { EditIcon } from '@/components/booking';

import { Button } from '@/components/ui/button';
import LocationRow from './LocationRow';

interface InPersonSectionProps {
	locations: ExtendedLocation[];
	cachedLocationData: Record<string, any>;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	onEditLocation: (type: string, customId?: string) => void;
}

const InPersonSection: React.FC<InPersonSectionProps> = ({
	locations,
	cachedLocationData,
	onCheckboxChange,
	onEditLocation,
}) => {
	const renderLocationCheckbox = (
		type: 'attendee_address' | 'person_address',
		title: string,
		defaultText: string
	) => {
		const location = locations.find((loc) => loc.type === type);
		const cachedFields = cachedLocationData[type] || {};
		const displayText =
			location?.fields?.location || cachedFields?.location;

		return (
			<LocationRow
				checked={locations.some((loc) => loc.type === type)}
				onCheckedChange={(checked) => onCheckboxChange(type, checked)}
			>
				{type === 'attendee_address' ? (
					<div className='flex flex-col'>
						<div className="text-[#3F4254] text-[16px] font-semibold">
							{__(title, 'doublescale')}
						</div>
						<div className="text-[#9197A4] text-[12px] italic">
							{__(defaultText, 'doublescale')}
						</div>
					</div>
				) : (
					<div className='flex items-center justify-between gap-3'>
						<div className='flex flex-col flex-1 min-w-0'>
							<div className="text-[#3F4254] text-[16px] font-semibold">
								{__(title, 'doublescale')}
							</div>
							<div className="text-[#3F4254] text-[12px] italic">
								{displayText || (
									<span className="text-[#9197A4]">
										{__(defaultText, 'doublescale')}
									</span>
								)}
							</div>
						</div>
						{location?.fields?.location && (
							<Button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onEditLocation(type);
								}}
								className="bg-transparent border-none text-[#3F4254] shadow-none"
							>
								<EditIcon />
								{__('Edit', 'doublescale')}
							</Button>
						)}
					</div>
				)}
			</LocationRow>
		);
	};

	return (
        <div className='flex flex-col gap-2.5 justify-start items-start'>
            <div className="text-[#09090B] text-[16px]">
				{__('In Person', 'doublescale')}
			</div>
            {renderLocationCheckbox(
				'attendee_address',
				'Attendee Address',
				'In Person'
			)}
            {renderLocationCheckbox(
				'person_address',
				'Organizer Address',
				'In Person'
			)}
        </div>
    );
};

export default InPersonSection;
