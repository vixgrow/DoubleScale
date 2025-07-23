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
	targetPosition,
	style = {},
	data,
	label,
}) => {
	const edgeData = data as ConditionEdgeData;
	const condition = edgeData?.condition || (label === 'Yes' ? 'yes' : 'no');
	const isYes = condition === 'yes';

	// Use getBezierPath for smoother curves that work better with our layout
	// Auto-detect proper source position based on condition for consistency
	// Always use the correct handle positions regardless of the provided sourcePosition
	const correctSourcePosition =
		condition === 'yes' ? Position.Left : Position.Right;
	const correctTargetPosition = targetPosition || Position.Top;
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition: correctSourcePosition, // Always use the correct source position
		targetX,
		targetY,
		targetPosition: correctTargetPosition, // Always use the correct target position
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
		strokeWidth: 1, // Slightly reduced thickness for cleaner look
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		transition: 'all 0.2s ease',
	};

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
						fontSize: '10px',
						fontWeight: 600,
						color: '#fff',
						background: isYes
							? '#52c41a' // Solid green for Yes
							: '#ff4d4f', // Solid red for No
						padding: '2px 6px',
						borderRadius: '8px',
						boxShadow: isYes
							? '0 1px 3px rgba(82, 196, 26, 0.3)' // Softer green shadow for Yes
							: '0 1px 3px rgba(255, 77, 79, 0.3)', // Softer red shadow for No
						border: '1px solid rgba(255, 255, 255, 0.8)', // White border for contrast
						textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
						zIndex: 10000, // Higher z-index to ensure labels appear above all other elements
						minWidth: '24px',
						textAlign: 'center',
						lineHeight: '1.2',
						fontFamily: 'system-ui, -apple-system, sans-serif',
						whiteSpace: 'nowrap',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '2px',
					}}
					className={`qcrm-condition-edge-label qcrm-condition-edge-label--${condition}`}
				>
					<span style={{ fontSize: '8px', fontWeight: 'bold' }}>
						{isYes ? '✓' : '✕'}
					</span>
					<span>{displayLabel}</span>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default ConditionEdge;
