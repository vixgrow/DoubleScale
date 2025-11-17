/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * React dependencies
 */
import React, { useEffect, useState } from 'react';

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
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Internal dependencies
 */
import { Deal } from '../../types';
import './style.scss';

import DealValueIcon from '@quillcrm/components/icons/deal-value';
import DealOwnerIcon from '@quillcrm/components/icons/deal-owner';

import { DealCardMenu } from './DealCardMenu';
import { formatCurrencyFull } from '../../utils/currency';

interface DealCardProps {
	deal: Deal;
	isDragging: boolean;
	onCardClick: (deal: Deal) => void;
	onDealEdit?: (deal: Deal) => void;
	onDealDelete?: (deal: Deal) => void;
	onAddNote?: (deal: Deal) => void;
	onDealLogCall?: (deal: Deal) => void;
	onDealScheduleMeeting?: (deal: Deal) => void;
	onDealLogEmail?: (deal: Deal) => void;
	stageColor?: string;
	stageProbability?: number;
	style?: React.CSSProperties;
	selectMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({
	deal,
	isDragging,
	onCardClick,
	onDealEdit,
	onDealDelete,
	onAddNote,
	onDealLogCall,
	onDealScheduleMeeting,
	onDealLogEmail,
	stageColor,
	stageProbability,
	style: customStyle = {},
	selectMode = false,
	isSelected = false,
	onToggleSelect,
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
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (deal) {
			setLoading(false);
		}
	}, [deal]);

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


	// Format currency value
	const formattedValue = useMemo(() => {
		return formatCurrencyFull(deal.value, deal.currency || 'USD');
	}, [deal.value, deal.currency]);

	const handleCardClick = (e: React.MouseEvent) => {
		if (isDraggging || (e.target as HTMLElement).closest('.drag-handle')) {
			return;
		}
		// In select mode, clicking the card toggles selection instead of opening detail
		if (selectMode) {
			onToggleSelect?.();
			return;
		}
		onCardClick(deal);
	};

	const handleActionClick = (action: string) => {
		if (action === 'view') {
			onCardClick(deal);
		} else if (action === 'edit') {
			onDealEdit?.(deal);
		} else if (action === 'delete') {
			onDealDelete?.(deal);
		} else if (action === 'add_note') {
			onAddNote?.(deal);
		} else if (action === 'log_call') {
			onDealLogCall?.(deal);
		} else if (action === 'schedule_meeting') {
			onDealScheduleMeeting?.(deal);
		} else if (action === 'log_email') {
			onDealLogEmail?.(deal);
		}
	};
	// if (loading) {
	// 	return (
	// 		<div
	// 			className="m-4"
	// 			style={{
	// 				height: '100%',
	// 				minHeight: '180px',
	// 			}}
	// 		>
	// 			<DealCardShimmer />
	// 		</div>
	// 	);
	// }

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...(selectMode ? {} : attributes)}
			{...(selectMode ? {} : listeners)}
			className={`deal-card m-4 ${isDragging || isDraggging ? 'dragging' : ''} ${deal.is_overdue ? 'overdue' : ''}`}
			onClick={handleCardClick}
		>
			<Card className={`w-full flex flex-col rounded-[16px] border ${isSelected ? 'border-[#3B82F6] border-2 bg-blue-50' : 'border-[#DEE1E6]'}`}>
				<CardHeader className="p-2.5">
					<div className="flex items-center justify-between text-[#09090B]">
						{/* Selection Checkbox */}
						{selectMode && (
							<div
								className="mr-2"
								onClick={(e) => {
									e.stopPropagation();
									onToggleSelect?.();
								}}
							>
								<Checkbox checked={isSelected} />
							</div>
						)}

						<CardTitle
							title={deal.title}
							className="text-lg font-bold leading-6 flex-1 truncate max-w-[120px]"
						>
							{deal.title}
						</CardTitle>

						{!selectMode && <DealCardMenu onActionClick={handleActionClick} />}
					</div>
				</CardHeader>
				<CardContent className=" flex  p-2.5">
					{/* <div className="flex flex-col"> */}
					<span className=" text-[#660FF1] text-base font-medium landing-6 flex items-center gap-1">
						<DealValueIcon color="#660FF1" />
						{__('Deal Value:', 'quillcrm')}
					</span>
					<p className=" text-[#09090B] text-lg font-bold landing-6 text-center ">
						{formattedValue}
					</p>
				</CardContent>
				<CardFooter className="flex  p-2.5 justify-between items-center">
					{deal.owner && (
						<div className="flex items-center gap-1">
							<div className="flex items-center gap-1">
								<span className="w-8 h-8 rounded-full border border-[#DEE1E6] flex items-center justify-center">
									<DealOwnerIcon />
								</span>
								<span className="text-base font-normal text-[#777] leading-6">
									{__('Owner:', 'quillcrm')}
								</span>
							</div>

							<p className="text-[#09090B] text-base font-medium truncate max-w-[120px] leading-6">
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
								{deal.priority.charAt(0).toUpperCase() +
									deal.priority.slice(1)}
							</span>
						)}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};
