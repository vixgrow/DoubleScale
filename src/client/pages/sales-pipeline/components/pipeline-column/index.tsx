/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import { useDroppable } from '@dnd-kit/core';

/**
 * Internal dependencies
 */
import { DealCard } from '../deal-card';
import { Deal } from '../../types';
import { StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';
import './style.scss';
import { NoDealsIcon } from '@quillcrm/components';
import WinTagIcon from '@quillcrm/components/icons/win-tag';
import { PlusIcon } from 'lucide-react';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import WeightedIcon from '@quillcrm/components/icons/weighted-icon';
import { DealCardShimmer } from '../deal-card/DealCardShimmer';
import React, { useState } from 'react';
import { NewDealModal } from '../new-deal-modal';

interface PipelineColumnProps {
	stage: {
		id: number;
		name: string;
		color: string;
		sort_order: number;
		win_probability: number;
	};
	deals: Deal[];
	isOver: boolean;
	activeDealId?: string | null;
	onDealView?: (dealId: number) => void;
	onDealEdit?: (deal: Deal) => void;
	onDealDelete?: (deal: Deal) => void;
	onDealAddNote?: (deal: Deal) => void;
	onDealLogCall?: (deal: Deal) => void;
	onDealScheduleMeeting?: (deal: Deal) => void;
	onDealLogEmail?: (deal: Deal) => void;
	index: number;
	totalStages: number;
	loading?: boolean;
	pipeline?: any;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
	stage,
	deals,
	index,
	totalStages,
	isOver,
	activeDealId,
	onDealView,
	onDealEdit,
	onDealDelete,
	onDealAddNote,
	onDealLogCall,
	onDealScheduleMeeting,
	onDealLogEmail,
	loading = false,
	pipeline,
}) => {
	const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
	const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
	const { setNodeRef: setDroppableRef, isOver: isDropOver } = useDroppable({
		id: `stage-${stage.id}`,
		data: {
			type: 'pipeline-stage',
			stageId: stage.id,
			stageName: stage.name,
		},
	});

	// Calculate column statistics
	const columnStats = useMemo(() => {
		const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
		const weightedValue = deals.reduce((sum, deal) => {
			// Use deal-specific probability if available, otherwise use stage default
			const probability = deal.probability ?? stage.win_probability;
			return sum + deal.value * (probability / 100);
		}, 0);
		const overdueCount = deals.filter((deal) => deal.is_overdue).length;

		return {
			totalDeals: deals.length,
			totalValue,
			weightedValue,
			overdueCount,
		};
	}, [deals, stage.win_probability]);

	const isFirst = index === 0;
	const isLast = index === totalStages - 1;

	return (
		<div
			ref={setDroppableRef}
			className={`pipeline-column min-w-[360px] flex flex-col flex-1 ${isDropOver ? 'drop-target' : ''} ${isOver ? 'drag-over' : ''}`}
		>
			{/* Column Header */}

			<div
				className="column-header h-32  relative rounded-t-[16px] "
				style={{ backgroundColor: stage.color }}
			>
				{isFirst && (
					<div
						className="absolute top-[1px] right-[-32px] w-0 h-0 z-20 rounded-sm"
						style={{
							borderTop: '60px solid transparent',
							borderBottom: '60px solid transparent',
							borderLeft: `40px solid ${stage.color}`,
						}}
					></div>
				)}
				{isLast && (
					<div
						className="absolute top-0 left-[-3px] w-0 h-0"
						style={{
							borderTop: '60px solid transparent',
							borderBottom: '60px solid transparent',
							borderLeft: `40px solid white`,
						}}
					></div>
				)}
				{!isFirst && !isLast && (
					<>
						<div
							className="absolute top-0 left-[-3px] w-0 h-0 "
							style={{
								borderTop: '60px solid transparent',
								borderBottom: '60px solid transparent',
								borderLeft: `40px solid white`,
							}}
						></div>
						<div
							className="absolute top-[1px] right-[-32px] w-0 h-0 z-20"
							style={{
								borderTop: '60px solid transparent',
								borderBottom: '60px solid transparent',
								borderLeft: `40px solid ${stage.color}`,
							}}
						></div>
					</>
				)}

				<div
					className={`${index === 0 ? 'left-0' : 'left-5'} absolute  w-full h-full p-3  z-10 flex flex-col `}
				>
					<div
						className={`flex justify-between ${index !== 0 ? 'px-5' : ''}`}
					>
						<div className=" flex gap-2">
							<h3
								className="stage-name text-[24px] font-semibold leading-normal tracking-[-1px] "
								style={{ color: StageTextColor(stage.color) }}
							>
								{stage.name} {`(${deals.length})`}{' '}
							</h3>
							<div className=" flex  bg-[#fff] rounded-[8px] py-1 px-2 gap-1">
								<span className="  flex justify-center items-center text-[#09090B]">
									{stage.win_probability}%
								</span>
								<WinTagIcon />
							</div>
						</div>
						<PlusIcon
							style={{ color: '#1E3A8A', cursor:'pointer' }}
							onClick={() => {
								setSelectedStageId(stage.id);
								setIsNewDealModalOpen(true);
							}}
						/>
					</div>

					<div
						className={`absolute bottom-3  flex justify-between px-2 gap-6 items-center z-20`}
					>
						{/* Total Value */}
						<div className="flex  gap-1">
							{/* <DealValueIcon /> */}
							<span className="text-[#777] text-base font-medium leading-[26px] tracking-[-.5px]">
								{columnStats.totalDeals === 1
									? __('Deal value:', 'quillcrm')
									: __('Deals value:', 'quillcrm')}
							</span>
							<span className="text-[#09090B] font-bold text-base leading-[26px] tracking-[-.5px]">
								${columnStats.totalValue}
								{columnStats.totalValue ? 'K' : ''}
							</span>
						</div>

						{/* Weighted Value */}
						<div className="flex  gap-1">
							{/* <WeightedIcon /> */}
							<span className="text-[#777] text-base font-medium leading-[26px] tracking-[-.5px]">
								{__('Weighted:', 'quillcrm')}
							</span>
							<span className="text-[#09090B] font-bold text-base leading-[26px] tracking-[-.5px]">
								${columnStats.weightedValue.toLocaleString()}
								{columnStats.weightedValue ? 'K' : ''}
							</span>
						</div>
					</div>
				</div>
			</div>

			{deals.length > 0 && (
				<div className=" w-full h-[2px] bg-[#ebecef]"></div>
			)}

			{/* Deals Container */}
			<div
				className={`deals-container overflow-y-auto flex-1 max-h-screen relative  rounded-br-[16px]  rounded-bl-[16px]  ${isDropOver ? 'accepting-drop' : ''}`}
				style={{ backgroundColor: stage.color }}
				data-stage-id={stage.id}
			>
				{loading ? (
				
					<div className="">
						{Array.from({ length: 3 }).map((_, shimmerIndex) => (
							<DealCardShimmer
								key={`shimmer-${stage.id}-${shimmerIndex}`}
								style={
									{
										'--stage-color': stage.color,
									} as React.CSSProperties
								}
							/>
						))}
					</div>
				) : deals.length === 0 ? (
					<div className=" flex justify-center items-center flex-col text-center h-full ">
						<span className=" block my-2">
							<NoDealsIcon />
						</span>
						<p className=" my-2 font-[inter] text-lg font-bold leading-7 tracking-[-.5px] text-[#09090B]">
							{__('No deals in this stage', 'quillcrm')}
						</p>
						<small className=" text-base font-normal leading-[26px] tracking-[-.5px] text-[#777]">
							{__('Drag deals here to move them to', 'quillcrm')}{' '}
							"{stage.name}"
						</small>
					</div>
				) : (
					<div className="">
						{deals.map((deal, index) => {
							const isDragging =
								activeDealId === `deal-${deal.id}`;
							return (
								<DealCard
									key={deal.id}
									deal={deal}
									isDragging={isDragging}
									onCardClick={(dealData) =>
										onDealView?.(dealData.id)
									}
									onDealEdit={onDealEdit}
									onDealDelete={onDealDelete}
									onAddNote={(deal) => onDealAddNote?.(deal)}
									onDealLogCall={(deal) =>
										onDealLogCall?.(deal)
									}
									onDealScheduleMeeting={(deal) =>
										onDealScheduleMeeting?.(deal)
									}
									onDealLogEmail={(deal) =>
										onDealLogEmail?.(deal)
									}
									stageColor={stage.color}
									stageProbability={stage.win_probability}
									style={
										{
											'--stage-color': stage.color,
											marginBottom:
												index < deals.length - 1
													? '12px'
													: '0',
										} as React.CSSProperties
									}
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Drop Indicator */}
			{/* {isDropOver && (
				<div className="drop-indicator">
					<div className="drop-indicator-line" />
					<span className="drop-indicator-text">
						{__('Drop here to move to', 'quillcrm')} "{stage.name}"
					</span>
				</div>
			)} */}
			<NewDealModal
				visible={isNewDealModalOpen}
				onClose={() => setIsNewDealModalOpen(false)}
				onSuccess={() => setIsNewDealModalOpen(false)}
				pipeline={pipeline}
				initialStageId={selectedStageId ?? undefined}
			/>
		</div>
	);
};
