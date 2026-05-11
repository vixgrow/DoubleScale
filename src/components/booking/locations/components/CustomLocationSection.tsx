import React from 'react';
import { __ } from '@wordpress/i18n';
import { FaPlus } from 'react-icons/fa';
import type { ExtendedLocation, CustomLocationState } from '../types';
import { EditIcon, TrashIcon } from '@/components/booking';

import { Button } from '@/components/ui/button';
import LocationRow from './LocationRow';

interface CustomLocationSectionProps {
	locations: ExtendedLocation[];
	customLocations: CustomLocationState[];
	onCustomCheckboxChange: (customId: string, checked: boolean) => void;
	onEditLocation: (type: string, customId?: string) => void;
	onRemoveCustomLocation: (customId: string) => void;
	onAddCustomLocation: () => void;
}

const CustomLocationSection: React.FC<CustomLocationSectionProps> = ({
	locations,
	customLocations,
	onCustomCheckboxChange,
	onEditLocation,
	onRemoveCustomLocation,
	onAddCustomLocation,
}) => {
	return (
        <div className='flex flex-col gap-0.5 justify-start items-start'>
            <div className="text-[#09090B] text-[16px]">
				{__('Other', 'doublescale')}
			</div>
            {customLocations.map((customLoc) => {
				const customLocation = locations.find(
					(loc) => loc.type === 'custom' && loc.id === customLoc.id
				);

				return (
					<LocationRow
						key={customLoc.id}
						checked={!!customLocation}
						onCheckedChange={(checked) =>
							onCustomCheckboxChange(customLoc.id, checked)
						}
					>
						<div className='flex items-center justify-between gap-3'>
							<div className='flex flex-col flex-1 min-w-0'>
								<div className="text-[#3F4254] text-[16px] font-semibold">
									{customLocation?.fields?.location ||
										customLoc.fields?.location ||
										__('Custom', 'doublescale')}
								</div>
								<div className="text-[#3F4254] text-[12px] italic">
									{customLocation?.fields?.description ||
										customLoc.fields?.description ||
										__('Custom', 'doublescale')}
								</div>
							</div>
							{customLocation?.fields?.location && (
								<div className='flex'>
									<Button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onEditLocation(
												'custom',
												customLoc.id
											);
										}}
										className="bg-transparent border-none text-[#3F4254] shadow-none hover:text-white"
									>
										<EditIcon />
										{__('Edit', 'doublescale')}
									</Button>
									<Button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onRemoveCustomLocation(
												customLoc.id
											);
										}}
										className="bg-transparent border-none text-destructive shadow-none hover:text-white"
									>
											<TrashIcon />
]										{__('Delete', 'doublescale')}
									</Button>
								</div>
							)}
						</div>
					</LocationRow>
				);
			})}
            <Button
                onClick={onAddCustomLocation}
                className="mt-[10px] text-primary-foreground font-semibold outline-none border-none shadow-none">{<FaPlus className="text-primary-foreground" />} 
                {__('Add Custom Location', 'doublescale')}
            </Button>
        </div>
    );
};

export default CustomLocationSection;
