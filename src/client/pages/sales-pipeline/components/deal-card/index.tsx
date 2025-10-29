/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * React dependencies
 */
import React, { useEffect } from 'react';

/**
 * External dependencies
 */
import { useDraggable } from '@dnd-kit/core';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

/**
 * Internal dependencies
 */
import { Deal } from '../../types';
import './style.scss';
import DealContactIcon from '@quillcrm/components/icons/deal-contact';
import DealCalenderIcon from '@quillcrm/components/icons/deal-calender';

import DealValueIcon from '@quillcrm/components/icons/deal-value';
import WeightedIcon from '@quillcrm/components/icons/weighted-icon';
import DealOwnerIcon from '@quillcrm/components/icons/deal-owner';

import { DealCardMenu } from './DealCardMenu';

interface DealCardProps {
	deal: Deal;
	isDragging: boolean;
	onCardClick: (deal: Deal) => void;
	onDealEdit?: (deal: Deal) => void;
	onDealDelete?: (deal:Deal) =>void;
	onAddNote?: (deal: Deal) => void;
	stageColor?: string;
	stageProbability?: number;
	style?: React.CSSProperties;
}

export const DealCard: React.FC<DealCardProps> = ({
	deal,
	isDragging,
	onCardClick,
	onDealEdit,
	onDealDelete,
	onAddNote,
	stageColor,
	stageProbability,
	style: customStyle = {},
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		isDragging: isDraggging,
	} = useDraggable({
		id: `deal-${deal.id}`,
		data: {
			type: 'deal',
			deal: deal,
			currentStageId: deal.stage?.id,
		},
	});

	const style = {
		'--stage-color': stageColor || '#6d78d8',
		...customStyle,
		opacity: isDragging || isDraggging ? 0.5 : 1,
	} as React.CSSProperties;

	// Format contact name
	const contactName = useMemo(() => {
		if (!deal.contact) return __('No contact assigned', 'quillcrm');
		const { first_name, last_name } = deal.contact;
		return (
			`${first_name || ''} ${last_name || ''}`.trim() ||
			__('Unknown contact', 'quillcrm')
		);
	}, [deal.contact]);

	useEffect(()=>{
      console.log(deal)
	},[deal])

	// Format expected close date
	const formattedDate = useMemo(() => {
		if (!deal.expected_close_date) return null;

		try {
			const date = new Date(deal.expected_close_date);
			return {
				formatted: date.toLocaleDateString(),
			};
		} catch {
			return null;
		}
	}, [deal.expected_close_date]);

	// Format currency value
	const formattedValue = useMemo(() => {
		return `$${deal.value.toLocaleString()}`;
	}, [deal.value]);

	// Calculate effective probability
	const effectiveProbability = useMemo(() => {
		return stageProbability ?? 0;
	}, [stageProbability]);

	// Format weighted value
	const formattedWeightedValue = useMemo(() => {
		return `$${deal.weighted_value.toLocaleString()}`;
	}, [deal.weighted_value]);

	const handleCardClick = (e: React.MouseEvent) => {
		if (isDraggging || (e.target as HTMLElement).closest('.drag-handle')) {
			return;
		}
		onCardClick(deal);
	};

	// const handleActionClick = (e: React.MouseEvent, action: string) => {
	// 	e.stopPropagation();

	// 	if (action === 'view') {
	// 		onCardClick(deal);
	// 	} else if (action === 'edit') {
	// 		onDealEdit?.(deal);
	// 	}
	// };
	const handleActionClick = (action: string) => {
		if (action === 'view') {
			onCardClick(deal);
		} else if (action === 'edit') {
			onDealEdit?.(deal);
		} else if (action === 'delete'){
			onDealDelete?.(deal)
		}else if (action === 'add_note') {
			onAddNote?.(deal); 
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`deal-card m-4 ${isDragging || isDraggging ? 'dragging' : ''} ${deal.is_overdue ? 'overdue' : ''}`}
			onClick={handleCardClick}
		>
			<Card className="w-full flex flex-col gap-1.5 rounded-[16px] border border-[#DEE1E6] ">
				<CardHeader className="flex flex-col gap-1  text-[#09090B]">
					<div className="flex items-center justify-between">
						<CardTitle
							title={deal.title}
							className="text-lg font-bold leading-[28px] tracking-[-.5px]"
						>
							{deal.title}
						</CardTitle>

						{/* <DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="text-base !active:border-0  !focus:border-0 !shadow-none !border-0 font-medium !text-[#374151] flex items-center justify-center gap-3 h-10 py-2 px-4"
								>
									<MoreHorizantail
										color="#1E3A8A"
										width={26}
										height={26}
									/>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								style={{
									boxShadow:
										'3px 3px 4px 0 rgba(0, 0, 0, 0.25)',
								}}
								className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
							>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<NoteAddIcon />
									{__('Add Note', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<CallLogIcon />
									{__('Log Call', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<EmailLogIcon />
									{__('LogEmail', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<MeetingDealIcon />
									{__('Meeting', 'quillcrm')}
								</DropdownMenuItem>
								<div className='h-[1px] bg-[#DEE1E6] m-1'>

								</div>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<ViewIcon/>
									{__('View Pipeline', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]">
									<EditHeaderIcon />
									{__('Edit Pipeline', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
									<TrashIcon />
									{__('Delete Pipeline', 'quillcrm')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu> */}
						<DealCardMenu onActionClick={handleActionClick} />
					</div>

					<div className="flex flex-wrap items-center gap-1 text-[#777] text-base font-medium font-[Inter] leading-[26px]">
						<span className="flex items-center gap-1">
							<DealContactIcon />
							{__(
								`Contact: ${deal.contact?.first_name || __('N/A', 'quillcrm')}`
							)}
						</span>

						{formattedDate && (
							<>
								<div className="h-5 w-[1px] bg-[#DEE1E6]" />
								<span className="flex items-center gap-1">
									<DealCalenderIcon />
									{formattedDate.formatted}
								</span>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent className=" flex  justify-between mb-0">
					<div className="flex flex-col">
						<span className=" text-[#660FF1] text-base font-medium landing-[26px] flex items-center gap-1">
							<DealValueIcon color="#660FF1" />
							{__('Deal Value', 'quillcrm')}
						</span>
						<p className=" text-[#09090B] text-lg font-bold landing-[28px] text-center ">
							{formattedValue}
						</p>
					</div>
					<div className=" flex flex-col">
						<span className=" text-[#458DC7] text-base font-medium landing-[26px] flex items-center gap-1">
							<WeightedIcon color="#458DC7" />
							{__('Weighted', 'quillcrm')}
						</span>
						<p className=" text-[#09090B] text-lg font-bold landing-[28px] text-center">
							{formattedWeightedValue}
						</p>
					</div>
					
				</CardContent>
				<div className=" h-0.5 bg-[#DEE1E6] mx-6 "></div>
				<CardFooter className='flex  justify-between items-center'>
				{deal.owner&&(
					<div className="flex items-center gap-1">
					<div className="flex items-center gap-1">
					  <span className="w-8 h-8 rounded-full border border-[#DEE1E6] flex items-center justify-center">
						<DealOwnerIcon />
					  </span>
					  <span className="text-base font-normal text-[#777] leading-[26px]">
						{__('Owner:', 'quillcrm')}
					  </span>
					</div>
				  
					<p className="text-[#09090B] text-base font-medium leading-[26px]">
					  {deal?.owner.display_name}
					</p>
				  </div>
				  
				)}
				  <div className="flex mt-1 gap-3">
  {deal.priority && (
    <span
      className={`
        text-base font-normal tracking-[-.32px] flex justify-center items-center py-1 px-2 rounded-[8px] border
        ${
          deal.priority === 'low'
            ? 'text-[#16A34A] border-[#16A34A] bg-[#EFFFF5]'
            : deal.priority === 'medium'
            ? 'text-[#A67D0A] border-[#E4B123] bg-[#FFF2CE]'
            : deal.priority === 'high'
            ? 'text-[#E13B3B] border-[#E13B3B] bg-[#FBE8E8]'
            : 'text-gray-700 border-gray-300 bg-gray-50'
        }
      `}
    >
      {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)}
    </span>
  )}
</div>
				</CardFooter>
			</Card>
		</div>
	);
};
