/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import { useDraggable } from '@dnd-kit/core';
import {
	Calendar,
	DollarSign,
	User,
	Clock,
	AlertTriangle,
	Eye,
	Edit3,
	MoreVertical,
	Target,
	Percent,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import { Deal } from '../../types';
import './style.scss';

interface DealCardProps {
	deal: Deal;
	isDragging: boolean;
	onCardClick: (deal: Deal) => void;
	onDealEdit?: (deal: Deal) => void;
	stageColor?: string;
	stageProbability?: number;
	style?: React.CSSProperties;
}

export const DealCard: React.FC<DealCardProps> = ({
	deal,
	isDragging,
	onCardClick,
	onDealEdit,
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
			currentStageId: deal.stage_id,
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
		return deal.probability ?? stageProbability ?? 0;
	}, [deal.probability, stageProbability]);

	// Format weighted value
	const formattedWeightedValue = useMemo(() => {
		return `$${deal.weighted_value.toLocaleString()}`;
	}, [deal.weighted_value]);

	const handleCardClick = (e: React.MouseEvent) => {
		// Don't trigger if clicking on drag handle
		if ((e.target as HTMLElement).closest('.drag-handle')) {
			return;
		}
		onCardClick(deal);
	};

	const handleActionClick = (e: React.MouseEvent, action: string) => {
		e.stopPropagation();

		if (action === 'view') {
			onCardClick(deal);
		} else if (action === 'edit') {
			onDealEdit?.(deal);
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`deal-card ${isDragging || isDraggging ? 'dragging' : ''} ${deal.is_overdue ? 'overdue' : ''}`}
			onClick={handleCardClick}
		>
			{/* Card Header */}
			<div className="card-header">
				<div className="deal-title-section">
					<h4 className="deal-title" title={deal.title}>
						{deal.title}
					</h4>
					<div className="deal-value">
						<DollarSign size={14} />
						<span>{formattedValue}</span>
					</div>
					{/* Probability Information */}
					<div className="deal-probability">
						<div className="probability-row">
							<Percent size={12} />
							<span className="probability-value">
								{effectiveProbability.toFixed(0)}%
							</span>
						</div>
					</div>
					{/* Weighted Value */}
					<div className="deal-weighted-value">
						<Target size={12} />
						<span className="weighted-label">
							{__('Weighted:', 'quillcrm')}{' '}
							{formattedWeightedValue}
						</span>
					</div>
				</div>

				<div className="card-actions">
					{/* Visual drag indicator */}
					<div
						className="drag-indicator"
						aria-label={__('Drag to move deal', 'quillcrm')}
					>
						<MoreVertical size={16} />
					</div>
				</div>
			</div>

			{/* Card Body */}
			<div className="card-body">
				{/* Contact Info */}
				<div className="contact-info">
					<User size={14} />
					<span className="contact-name">{contactName}</span>
				</div>

				{/* Owner Info */}
				{deal.owner && (
					<div className="owner-info">
						<span className="owner-label">
							{__('Owner:', 'quillcrm')}
						</span>
						<span className="owner-name">
							{deal.owner.display_name}
						</span>
					</div>
				)}

				{/* Expected Close Date */}
				{formattedDate && (
					<div
						className={`close-date ${deal.is_overdue ? 'overdue' : ''}`}
					>
						<Calendar size={14} />
						<span className="date-text">
							{formattedDate.formatted}
						</span>
						{deal.days_until_close !== null && (
							<span className="days-until">
								{deal.is_overdue
									? `${Math.abs(deal.days_until_close)} ${__('days overdue', 'quillcrm')}`
									: deal.days_until_close === 0
										? __('Due today', 'quillcrm')
										: `${deal.days_until_close} ${__('days left', 'quillcrm')}`}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Card Footer */}
			<div className="card-footer">
				<div className="quick-actions">
					<button
						className="action-btn view-btn"
						onClick={(e) => handleActionClick(e, 'view')}
						title={__('View details', 'quillcrm')}
					>
						<Eye size={14} />
					</button>
					<button
						className="action-btn edit-btn"
						onClick={(e) => handleActionClick(e, 'edit')}
						title={__('Edit deal', 'quillcrm')}
					>
						<Edit3 size={14} />
					</button>
				</div>

				{/* Status Indicators */}
				<div className="status-indicators">
					{deal.is_overdue && (
						<div
							className="overdue-indicator"
							title={__('Deal is overdue', 'quillcrm')}
						>
							<AlertTriangle size={14} />
							<span>{__('Overdue', 'quillcrm')}</span>
						</div>
					)}
					{deal.days_until_close === 0 && !deal.is_overdue && (
						<div
							className="due-today-indicator"
							title={__('Due today', 'quillcrm')}
						>
							<Clock size={14} />
							<span>{__('Due today', 'quillcrm')}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
