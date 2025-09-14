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
import './style.scss';

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
	onDealView?: (dealId: number) => void;
	onDealEdit?: (deal: Deal) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
	stage,
	deals,
	isOver,
	onDealView,
	onDealEdit,
}) => {
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

	return (
		<div
			ref={setDroppableRef}
			className={`pipeline-column ${isDropOver ? 'drop-target' : ''} ${isOver ? 'drag-over' : ''}`}
		>
			{/* Column Header */}
			<div
				className="column-header"
				style={{ backgroundColor: stage.color }}
			>
				<div className="header-content">
					<h3 className="stage-name">{stage.name}</h3>
					<div className="stage-meta">
						<span className="win-probability">
							{stage.win_probability}%{' '}
							{__('win rate', 'quillcrm')}
						</span>
					</div>
				</div>

				{/* Column Statistics */}
				<div className="column-stats">
					<div className="stat-row">
						<span className="deal-count">
							{columnStats.totalDeals}{' '}
							{columnStats.totalDeals === 1
								? __('deal', 'quillcrm')
								: __('deals', 'quillcrm')}
						</span>
						{columnStats.overdueCount > 0 && (
							<span className="overdue-count">
								{columnStats.overdueCount}{' '}
								{__('overdue', 'quillcrm')}
							</span>
						)}
					</div>
					<div className="value-row">
						<span className="total-value">
							${columnStats.totalValue.toLocaleString()}
						</span>
						<span className="weighted-value">
							(${columnStats.weightedValue.toLocaleString()}{' '}
							{__('weighted', 'quillcrm')})
						</span>
					</div>
				</div>
			</div>

			{/* Deals Container */}
			<div
				className={`deals-container ${isDropOver ? 'accepting-drop' : ''}`}
				data-stage-id={stage.id}
			>
				{deals.length === 0 ? (
					<div className="empty-stage">
						<div className="empty-message">
							<span className="empty-icon">📋</span>
							<p>{__('No deals in this stage', 'quillcrm')}</p>
							<small>
								{__(
									'Drag deals here to move them to',
									'quillcrm'
								)}{' '}
								"{stage.name}"
							</small>
						</div>
					</div>
				) : (
					<div className="deals-list">
						{deals.map((deal, index) => (
							<DealCard
								key={deal.id}
								deal={deal}
								isDragging={false}
								onCardClick={(dealData) => {
									onDealView?.(dealData.id);
								}}
								onDealEdit={onDealEdit}
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
						))}
					</div>
				)}
			</div>

			{/* Drop Indicator */}
			{isDropOver && (
				<div className="drop-indicator">
					<div className="drop-indicator-line" />
					<span className="drop-indicator-text">
						{__('Drop here to move to', 'quillcrm')} "{stage.name}"
					</span>
				</div>
			)}
		</div>
	);
};
