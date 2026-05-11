import React from 'react';
import { __ } from '@wordpress/i18n';
import type { ExtendedLocation } from '../types';
import { EditIcon } from '@/components/booking';

import { Button } from '@/components/ui/button';
import LocationRow from './LocationRow';

interface PhoneOnlineSectionProps {
	locations: ExtendedLocation[];
	cachedLocationData: Record<string, any>;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	onEditLocation: (type: string, customId?: string) => void;
}

const PhoneOnlineSection: React.FC<PhoneOnlineSectionProps> = ({
	locations,
	cachedLocationData,
	onCheckboxChange,
	onEditLocation,
}) => {
	const renderLocationCheckbox = (
		type: 'attendee_phone' | 'person_phone' | 'online',
		title: string,
		defaultText: string,
		fieldKey?: string
	) => {
		const location = locations.find((loc) => loc.type === type);
		const cachedFields = cachedLocationData[type] || {};
		const displayField = fieldKey || 'phone';
		const displayText =
			location?.fields?.[displayField] || cachedFields?.[displayField];

		const isSimpleType = type === 'attendee_phone';

		return (
			<LocationRow
				checked={locations.some((loc) => loc.type === type)}
				onCheckedChange={(checked) => onCheckboxChange(type, checked)}
			>
				{isSimpleType ? (
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
						{displayText && (
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
				{__('Phone & Online Meeting', 'doublescale')}
			</div>
            {renderLocationCheckbox(
				'attendee_phone',
				'Attendee Phone',
				'Phone'
			)}
            {renderLocationCheckbox(
				'person_phone',
				'Organizer Phone',
				'Phone',
				'phone'
			)}
            {renderLocationCheckbox(
				'online',
				'Online Meeting',
				'Online',
				'meeting_url'
			)}
        </div>
    );
};

export default PhoneOnlineSection;
