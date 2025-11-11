/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	KeyboardSensor,
	useSensor,
	useSensors,
	closestCenter,
	DragStartEvent,
	DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// charts
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
ChartJS.register(ArcElement, Tooltip);

/**
 * Internal dependencies
 */
import { PipelineColumn } from '../pipeline-column';
import { DealCard } from '../deal-card';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { Deal } from '../../types';
import './style.scss';
import AllDealIcon from '@quillcrm/components/icons/all-deals';
import { SalesPipelineSkeleton } from '../../SalesPipelineSkeleton';

interface KanbanBoardProps {
	pipeline: {
		id: number;
		name: string;
		stages: Array<{
			id: number;
			name: string;
			color: string;
			sort_order: number;
			win_probability: number;
		}>;
	};
	deals: Deal[];
	onRefresh: () => void;
	updateDealOptimistically: (dealId: number, updates: any) => void;
	onDealView?: (dealId: number) => void;
	onDealEdit?: (deal: Deal) => void;
	onDealDelete?: (deal: Deal) => void;
	onDealAddNote?: (deal: Deal) => void;
	onDealLogCall?: (deal: Deal) => void;
	onDealScheduleMeeting?: (deal: Deal) => void;
	onDealLogEmail?: (deal: Deal) => void;
	loading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
	pipeline,
	deals,
	updateDealOptimistically,
	onDealView,
	onDealEdit,
	onDealDelete,
	onDealAddNote,
	onDealLogCall,
	onDealScheduleMeeting,
	onDealLogEmail,
	loading = false,
	
}) => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { moveDealToStage } = useDealOperations();

	// Configure sensors for better accessibility and UX
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 3, // Reduce distance to make drag more responsive
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Group deals by stage
	const dealsByStage = useMemo(() => {
		const grouped = pipeline.stages.reduce(
			(acc, stage) => {
				// Handle both string and number stage IDs
				const stageDeals = deals.filter(
					(deal) =>
						parseInt(String(deal.stage?.id)) ===
						parseInt(String(stage.id))
				);
				acc[stage.id] = stageDeals;
				return acc;
			},
			{} as Record<number, typeof deals>
		);

		return grouped;
	}, [deals, pipeline.stages]);

	// Get the currently dragged deal
	const activeDeal = useMemo(() => {
		if (!activeId) return null;
		const dealId = parseInt(activeId.replace('deal-', ''));
		return deals.find((deal) => deal.id === dealId) || null;
	}, [activeId, deals]);

	const handleDragStart = ({ active }: DragStartEvent) => {
		const activeData = active.data.current;
		if (activeData?.type === 'deal') {
			setActiveId(String(active.id));
		}
	};

	const handleDragEnd = async ({ active, over }: DragEndEvent) => {
		console.log('Drag ended:', {
			activeId: active.id,
			overId: over?.id,
			overData: over?.data,
		});
		setActiveId(null);

		if (!over) {
			console.log('No drop target');
			return;
		}

		const activeData = active.data.current;
		const overData = over.data.current;

		// Only handle deal drops
		if (activeData?.type !== 'deal') {
			return;
		}

		const draggedDeal = activeData.deal;
		let targetStageId: number | null = null;

		// Determine target stage based on drop target type
		if (overData?.type === 'pipeline-stage') {
			// Dropped directly on a stage column
			targetStageId = overData.stageId;
		} else if (overData?.type === 'deal') {
			// Dropped on another deal - move to that deal's stage
			targetStageId = overData.deal.stage?.id;
		}

		// Handle type coercion for stage ID comparison
		if (
			!targetStageId ||
			parseInt(String(targetStageId)) ===
				parseInt(String(draggedDeal.stage?.id))
		) {
			console.log('No stage change needed');
			return;
		}

		const currentStage = pipeline.stages.find(
			(stage) =>
				parseInt(String(stage.id)) ===
				parseInt(String(draggedDeal.stage?.id))
		);

		const targetStage = pipeline.stages.find(
			(stage) =>
				parseInt(String(stage.id)) === parseInt(String(targetStageId))
		);

		if (!targetStage || !currentStage) {
			console.log('Target or current stage not found');
			return;
		}

		// Check if deal has custom probability
		const hasCustomProbability =
			draggedDeal.probability !== null &&
			draggedDeal.probability !== undefined;

		if (hasCustomProbability) {
			// Deal has custom probability - preserve it automatically (no modal)
			await performDealMove(
				draggedDeal.id,
				targetStageId,
				false,
				draggedDeal
			);
		} else {
			// Deal has no custom probability - automatically sync to new stage probability
			await performDealMove(
				draggedDeal.id,
				targetStageId,
				true,
				draggedDeal
			);
		}
	};

	const performDealMove = async (
		dealId: number,
		targetStageId: number,
		updateProbability: boolean,
		deal: Deal
	) => {
		// Find the target stage object for optimistic update
		const targetStage = pipeline.stages.find(
			(stage) => stage.id === targetStageId
		);

		if (!targetStage) {
			console.error('Target stage not found:', targetStageId);
			return;
		}

		const newProbability = targetStage.win_probability;
		const newWeightedValue = deal.value * (newProbability / 100);

		// Optimistically update the deal's stage object and weighted value
		updateDealOptimistically(dealId, {
			stage: {
				id: targetStage.id,
				name: targetStage.name,
				color: targetStage.color,
				win_probability: targetStage.win_probability,
			},
			probability: newProbability,
			weighted_value: newWeightedValue,
		});

		try {
			console.log(
				`Moving deal ${dealId} to stage ${targetStageId} with updateProbability: ${updateProbability}`
			);
			await moveDealToStage(dealId, targetStageId, updateProbability);

			// No need to refresh - optimistic update already applied
		} catch (error) {
			console.error('Failed to move deal:', error);

			// Rollback the optimistic update
			updateDealOptimistically(dealId, {
				stage: deal.stage,
				probability: deal.probability,
				weighted_value: deal.weighted_value,
			});

			alert(__('Failed to move deal. Please try again.', 'quillcrm'));
		}
	};

	// Calculate pipeline statistics
	const totalDeals = deals.length;
	const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
	const weightedValue = deals.reduce((sum, deal) => {
		// Use the backend-calculated weighted_value if available, otherwise calculate
		return sum + (deal.weighted_value || 0);
	}, 0);
	
	// Calculate average win rate (average probability across all deals)
	const avgWinRate = deals.length > 0 
		? deals.reduce((sum, deal) => {
			const probability = deal.probability ?? deal.stage?.win_probability ?? 0;
			return sum + probability;
		}, 0) / deals.length
		: 0;
	if (loading) {
		return <SalesPipelineSkeleton />;
	}

	return (
		<div className="kanban-board">
			{/* Pipeline Statistics */}
			<div className=" mb-6 w-full overflow-hidden ">
				<div className="flex justify-between items-center gap-8">
					<div className="flex w-full gap-4">
						<div className="stat-item flex justify-between items-center border-l-[3px] border-[#3B82F6] rounded-[8px] bg-[#F8F8F8] p-4 w-[25%]">
							<div className=" flex flex-col">
								<span className="stat-label text-2xl font-semibold pb-2 text-[#09090B] tracking-[-1px] font-[inter] ">
									{totalDeals}
								</span>
								<span className="stat-value text-lg font-normal leading-[28px] tracking-[-.5px] font-[inter] text-[#777] ">
									{__('Total Deals', 'quillcrm')}
								</span>
							</div>
							<div className=" bg-[#E4EEFD] flex justify-center items-center w-10 h-10 p-2  rounded-full ">
								<AllDealIcon />
							</div>
						</div>
					<div className="stat-item flex justify-between items-center border-l-[3px] border-[#660FF1] rounded-[8px] bg-[#F8F8F8] p-4 w-[25%]">
						<div className="flex flex-col">
							<span className="stat-label text-2xl font-semibold pb-2 text-[#09090B] tracking-[-1px] font-[inter]">
								{avgWinRate.toFixed(1)}%
							</span>
							<span className="stat-value text-lg font-normal leading-[28px] tracking-[-.5px] font-[inter] text-[#777]">
								{__('Avg Win Rate', 'quillcrm')}
							</span>
						</div>
						<div className="w-[52px] h-[51px]">
							<Doughnut
								data={{
									datasets: [
										{
											data: [
												avgWinRate,
												100 - avgWinRate,
											],
											backgroundColor: [
												'#660FF1',
												'#E5E7EB',
											],
											borderWidth: 0,
										},
									],
								}}
								options={{
									cutout: '75%',
									plugins: {
										tooltip: { enabled: false },
									},
									animation: {
										duration: 1000,
										easing: 'easeOutQuart',
									},
								}}
							/>
						</div>
					</div>
						<div className="stat-item flex justify-between border-l-[3px] border-[#16A34A] rounded-[8px] bg-[#F8F8F8] p-4 w-[45%]">
							<div className=" flex justify-between items-center w-[45%]">
								<div className="flex flex-col">
									<span className="stat-label text-2xl font-semibold pb-2 text-[#09090B] tracking-[-1px] font-[inter]">
										${totalValue.toLocaleString()}
									</span>
									<span className="stat-value text-lg font-normal leading-[28px] tracking-[-.5px] font-[inter] text-[#777]">
										{__('Total Value', 'quillcrm')}
									</span>
								</div>
								<div className="w-[52px] h-[51px]">
									<Doughnut
										data={{
											datasets: [
												{
													data: [100, 0],
													backgroundColor: [
														'#16A34A',
														'#E5E7EB',
													],
													borderWidth: 0,
												},
											],
										}}
										options={{
											cutout: '80%',
											plugins: {
												tooltip: { enabled: false },
											},
											animation: {
												duration: 1000,
												easing: 'easeOutQuart',
											},
										}}
									/>
								</div>
							</div>
							<div className="w-[1px] h-full bg-[#DEE1E6]"></div>
							<div className="flex justify-between items-center w-[45%]">
								<div className="flex flex-col">
									<span className="stat-label text-2xl font-semibold pb-2 text-[#09090B] tracking-[-1px] font-[inter]">
										${weightedValue.toLocaleString()}
									</span>
									<span className="stat-value text-lg font-normal leading-[28px] tracking-[-.5px] font-[inter] text-[#777]">
										{__('weighted Value', 'quillcrm')}
									</span>
								</div>
								<div className="w-[52px] h-[51px]">
									<Doughnut
										data={{
											datasets: [
												{
													data: [
														weightedValue,
														100 - weightedValue,
													],
													backgroundColor: [
														'#E4B123',
														'#E5E7EB',
													],
													borderWidth: 0,
												},
											],
										}}
										options={{
											cutout: '80%',
											plugins: {
												tooltip: { enabled: false },
											},
											animation: {
												duration: 1000,
												easing: 'easeOutQuart',
											},
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Kanban Board */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="kanban-columns overflow-x-auto">
					{pipeline.stages
						.sort((a, b) => a.sort_order - b.sort_order)
						.map((stage, index) => (
							<PipelineColumn
								key={stage.id}
								stage={stage}
								index={index}
								totalStages={pipeline.stages.length}
								deals={dealsByStage[stage.id] || []}
								isOver={false} // Will be enhanced with collision detection
								activeDealId={activeId}
								onDealView={onDealView}
								onDealEdit={onDealEdit}
								onDealDelete={onDealDelete}
								onDealAddNote={onDealAddNote}
								onDealLogCall={onDealLogCall}
								onDealScheduleMeeting={onDealScheduleMeeting}
								onDealLogEmail={onDealLogEmail}
								loading={loading}
								// pipeline={data}
								pipeline={pipeline}
								
							/>
						))}
				</div>

				{/* Drag Overlay */}
				<DragOverlay adjustScale={false}>
					{activeDeal ? (
						<div className="drag-overlay">
							<DealCard
								deal={activeDeal}
								isDragging={true}
								onCardClick={() => {}} // No-op during drag
								onAddNote={onDealAddNote}
								onDealLogCall={onDealLogCall}
								onDealScheduleMeeting={onDealScheduleMeeting}
								onDealLogEmail={onDealLogEmail}
								stageColor={
									pipeline.stages.find(
										(s) => s.id === activeDeal.stage?.id
									)?.color
								}
								stageProbability={
									pipeline.stages.find(
										(s) => s.id === activeDeal.stage?.id
									)?.win_probability
								}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
};
