/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	EdgeProps,
	getBezierPath,
	EdgeLabelRenderer,
	BaseEdge,
	Position,
	getSmoothStepPath,
} from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';

interface ConditionEdgeData {
	sourceStep?: AutomationStep;
	targetStep?: AutomationStep;
	condition?: 'yes' | 'no';
	label?: string;
}

const ConditionEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	markerEnd,
	label,
}) => {
	const edgeData = data as ConditionEdgeData;
	const condition = edgeData?.condition || (label === 'Yes' ? 'yes' : 'no');
	const isYes = condition === 'yes';

	// Determine the best path type based on positions
	const usesSmoothStep =
		sourcePosition === Position.Left || sourcePosition === Position.Right;

	const [edgePath, labelX, labelY] = usesSmoothStep
		? getSmoothStepPath({
				sourceX,
				sourceY,
				sourcePosition: sourcePosition || Position.Left,
				targetX,
				targetY,
				targetPosition: targetPosition || Position.Top,
				borderRadius: 20,
			})
		: getBezierPath({
				sourceX,
				sourceY,
				sourcePosition: sourcePosition || Position.Left,
				targetX,
				targetY,
				targetPosition: targetPosition || Position.Top,
			});

	// Enhanced styling based on condition
	const edgeStyle = {
		...style,
		stroke: isYes ? '#52c41a' : '#ff4d4f',
		strokeWidth: 3,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		filter: `drop-shadow(0 2px 4px ${isYes ? 'rgba(82, 196, 26, 0.3)' : 'rgba(255, 77, 79, 0.3)'})`,
		transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
	};

	// Enhanced marker end
	const enhancedMarkerEnd = {
		type: markerEnd?.type || 'arrowclosed',
		color: isYes ? '#52c41a' : '#ff4d4f',
		width: 20,
		height: 20,
	};

	const displayLabel =
		label || (isYes ? __('Yes', 'quillcrm') : __('No', 'quillcrm'));

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={edgeStyle}
				markerEnd={enhancedMarkerEnd}
				className={`qcrm-condition-edge qcrm-condition-edge--${condition}`}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						pointerEvents: 'none',
						fontSize: '12px',
						fontWeight: 900,
						color: '#fff',
						background: isYes
							? 'linear-gradient(135deg, #52c41a, #73d13d)'
							: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
						padding: '4px 10px',
						borderRadius: '12px',
						boxShadow: isYes
							? '0 2px 8px rgba(82, 196, 26, 0.4)'
							: '0 2px 8px rgba(255, 77, 79, 0.4)',
						border: '2px solid rgba(255, 255, 255, 0.8)',
						backdropFilter: 'blur(4px)',
						textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
						transition: 'all 0.2s ease',
						zIndex: 1000,
					}}
					className={`qcrm-condition-edge-label qcrm-condition-edge-label--${condition}`}
				>
					{isYes ? '✓' : '✕'} {displayLabel}
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default ConditionEdge;
