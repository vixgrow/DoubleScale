/**
 * External dependencies
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';
import StepReorderControls from './step-reorder-controls';
import { useWorkflowReorder } from './workflow-reorder-context';

interface SortableNodeContainerProps {
	step: AutomationStep;
	viewMode?: boolean;
	className?: string;
	onClick?: () => void;
	children: React.ReactNode;
}

const SortableNodeContainer: React.FC<SortableNodeContainerProps> = ({
	step,
	viewMode = false,
	className = '',
	onClick,
	children,
}) => {
	const { isDragging: isGlobalDragging } = useWorkflowReorder();
	const [controlsOpen, setControlsOpen] = useState(false);
	const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		isOver,
	} = useSortable({
		id: step.id.toString(),
		data: {
			parent_id: step.parent_id ?? null,
			condition: step.condition ?? null,
		},
		disabled: viewMode,
	});

	useEffect(() => {
		if (isDragging) {
			setControlsOpen(true);
		}
	}, [isDragging]);

	const openControls = () => {
		if (hideControlsTimer.current) {
			clearTimeout(hideControlsTimer.current);
			hideControlsTimer.current = undefined;
		}
		setControlsOpen(true);
	};

	const scheduleHideControls = () => {
		if (isDragging) {
			return;
		}

		if (hideControlsTimer.current) {
			clearTimeout(hideControlsTimer.current);
		}

		hideControlsTimer.current = setTimeout(() => {
			setControlsOpen(false);
		}, 200);
	};

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const stateClasses = [
		controlsOpen || isDragging ? 'doublescale-reactflow-node--controls-open' : '',
		isDragging ? 'doublescale-reactflow-node--dragging' : '',
		isOver && !isDragging ? 'doublescale-reactflow-node--drop-over' : '',
		isGlobalDragging && !isDragging && !isOver
			? 'doublescale-reactflow-node--drag-active'
			: '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`${className}${stateClasses ? ` ${stateClasses}` : ''}`}
			onClick={onClick}
			onMouseEnter={openControls}
			onMouseLeave={scheduleHideControls}
		>
			{isOver && !isDragging && (
				<div
					className="doublescale-reactflow-node__drop-indicator"
					aria-hidden="true"
				/>
			)}

			{!viewMode && (
				<StepReorderControls
					step={step}
					dragHandleProps={{ attributes, listeners }}
					isDragging={isDragging}
					isVisible={controlsOpen || isDragging}
					onMouseEnter={openControls}
					onMouseLeave={scheduleHideControls}
				/>
			)}
			{children}
		</div>
	);
};

export default SortableNodeContainer;
