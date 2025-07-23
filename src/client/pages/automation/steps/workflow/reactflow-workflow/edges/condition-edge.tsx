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

	// Use getBezierPath for smoother curves that work better with our layout
	// Auto-detect proper source position based on condition for consistency
	const correctSourcePosition =
		condition === 'yes' ? Position.Left : Position.Right;
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition: sourcePosition || correctSourcePosition,
		targetX,
		targetY,
		targetPosition: targetPosition || Position.Top,
	});

	// Debug logging
	console.log('ConditionEdge render:', {
		id,
		condition,
		label,
		edgeData,
		labelX,
		labelY,
	});

	// Enhanced styling based on condition with clear color differentiation
	const edgeStyle = {
		...style,
		stroke: isYes ? '#52c41a' : '#ff4d4f', // Green for Yes, Red for No
		strokeWidth: 3, // Optimal thickness for clarity
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		filter: `drop-shadow(0 2px 4px ${isYes ? 'rgba(82, 196, 26, 0.3)' : 'rgba(255, 77, 79, 0.3)'})`,
		transition: 'all 0.2s ease',
	};

	// Use the provided markerEnd or undefined for clean rendering
	const enhancedMarkerEnd = markerEnd;

	const displayLabel =
		edgeData?.label ||
		label ||
		(isYes ? __('Yes', 'quillcrm') : __('No', 'quillcrm'));

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
						left: `${labelX}px`,
						top: `${labelY}px`,
						transform: 'translate(-50%, -50%)',
						pointerEvents: 'none',
						fontSize: '11px',
						fontWeight: 600,
						color: '#fff',
						background: isYes
							? '#52c41a' // Solid green for Yes
							: '#ff4d4f', // Solid red for No
						padding: '3px 8px',
						borderRadius: '10px',
						boxShadow: isYes
							? '0 2px 6px rgba(82, 196, 26, 0.4)' // Softer green shadow for Yes
							: '0 2px 6px rgba(255, 77, 79, 0.4)', // Softer red shadow for No
						border: '2px solid rgba(255, 255, 255, 0.9)', // White border for contrast
						textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
						zIndex: 10000, // Higher z-index to ensure labels appear above all other elements
						minWidth: '28px',
						textAlign: 'center',
						lineHeight: '1.2',
						fontFamily: 'system-ui, -apple-system, sans-serif',
						whiteSpace: 'nowrap',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '3px',
					}}
					className={`qcrm-condition-edge-label qcrm-condition-edge-label--${condition}`}
				>
					<span style={{ fontSize: '9px', fontWeight: 'bold' }}>
						{isYes ? '✓' : '✕'}
					</span>
					<span>{displayLabel}</span>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default ConditionEdge;
