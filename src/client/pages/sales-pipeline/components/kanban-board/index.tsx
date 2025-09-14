/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

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

/**
 * Internal dependencies
 */
import { PipelineColumn } from '../pipeline-column';
import { DealCard } from '../deal-card';
import { useDealOperations } from '../../hooks/use-deal-operations';
import './style.scss';

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
	deals: Array<{
		id: number;
		title: string;
		value: number;
		currency: string;
		stage_id: number;
		contact?: {
			first_name: string;
			last_name: string;
		};
		expected_close_date?: string;
		is_overdue: boolean;
		days_until_close: number | null;
		weighted_value: number;
		owner?: {
			display_name: string;
		};
	}>;
	onRefresh: () => void;
	updateDealOptimistically: (dealId: number, updates: any) => void;
	onDealView?: (dealId: number) => void;
	onDealEdit?: (deal: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
	pipeline,
	deals,
	onRefresh,
	updateDealOptimistically,
	onDealView,
	onDealEdit,
}) => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { moveDealToStage } = useDealOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	// Configure sensors for better accessibility and UX
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Require 8px of movement before drag starts
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
						parseInt(String(deal.stage_id)) ===
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
		console.log('Drag started:', active.id, active.data);
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
			targetStageId = overData.deal.stage_id;
		}

		// Handle type coercion for stage ID comparison
		if (
			!targetStageId ||
			parseInt(String(targetStageId)) ===
				parseInt(String(draggedDeal.stage_id))
		) {
			console.log('No stage change needed');
			return;
		}

		const targetStage = pipeline.stages.find(
			(stage) =>
				parseInt(String(stage.id)) === parseInt(String(targetStageId))
		);

		if (!targetStage) {
			console.log('Target stage not found');
			return;
		}

		// Optimistically update the deal's stage
		updateDealOptimistically(draggedDeal.id, { stage_id: targetStageId });

		try {
			console.log(
				`Moving deal ${draggedDeal.id} to stage ${targetStageId}`
			);
			await moveDealToStage(draggedDeal.id, targetStageId);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Deal "${draggedDeal.title}" moved to "${targetStage.name}"`,
						'quillcrm'
					),
				});
			} else {
				console.log(
					`Success: Deal "${draggedDeal.title}" moved to "${targetStage.name}"`
				);
			}

			// No need to refresh - optimistic update already applied
		} catch (error) {
			console.error('Failed to move deal:', error);

			// Rollback the optimistic update
			updateDealOptimistically(draggedDeal.id, {
				stage_id: draggedDeal.stage_id,
			});

			if (createNotice) {
				createNotice({
					type: 'error',
					message: __(
						'Failed to move deal. Please try again.',
						'quillcrm'
					),
				});
			} else {
				alert(__('Failed to move deal. Please try again.', 'quillcrm'));
			}
		}
	};

	// Calculate pipeline statistics
	const totalDeals = deals.length;
	const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
	const weightedValue = deals.reduce((sum, deal) => {
		// Use the backend-calculated weighted_value if available, otherwise calculate
		return sum + (deal.weighted_value || 0);
	}, 0);

	return (
		<div className="kanban-board">
			{/* Pipeline Statistics */}
			<div className="pipeline-stats mb-6 p-4 bg-white rounded-lg border border-gray-200">
				<div className="flex justify-between items-center">
					<div className="flex gap-8">
						<div className="stat-item">
							<span className="stat-label text-sm text-gray-600">
								{__('Total Deals', 'quillcrm')}
							</span>
							<span className="stat-value text-2xl font-bold text-gray-900">
								{totalDeals}
							</span>
						</div>
						<div className="stat-item">
							<span className="stat-label text-sm text-gray-600">
								{__('Total Value', 'quillcrm')}
							</span>
							<span className="stat-value text-2xl font-bold text-green-600">
								${totalValue.toLocaleString()}
							</span>
						</div>
						<div className="stat-item">
							<span className="stat-label text-sm text-gray-600">
								{__('Weighted Value', 'quillcrm')}
							</span>
							<span className="stat-value text-2xl font-bold text-blue-600">
								${weightedValue.toLocaleString()}
							</span>
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
				<div className="kanban-columns">
					{pipeline.stages
						.sort((a, b) => a.sort_order - b.sort_order)
						.map((stage) => (
							<PipelineColumn
								key={stage.id}
								stage={stage}
								deals={dealsByStage[stage.id] || []}
								isOver={false} // Will be enhanced with collision detection
								onDealView={onDealView}
								onDealEdit={onDealEdit}
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
								stageColor={
									pipeline.stages.find(
										(s) => s.id === activeDeal.stage_id
									)?.color
								}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
};
