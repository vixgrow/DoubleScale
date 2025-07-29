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

	// Create distinct curves for Yes/No branches from single source handle
	const correctSourcePosition = Position.Bottom;
	const correctTargetPosition = targetPosition || Position.Top;

	// Calculate the horizontal distance and create pronounced curves
	const horizontalDistance = Math.abs(targetX - sourceX);

	// Create symmetric curves for both Yes and No branches
	const branchDirection = isYes ? -1 : 1; // Left for Yes (-1), Right for No (1)

	// Symmetric curve parameters to ensure equal heights
	const horizontalSpread = 60; // How far to spread horizontally from center
	const curveHeight = 80; // Consistent curve height for both branches
	const targetOffset = 20; // Small offset for target positioning

	// Calculate symmetric control points
	const cp1X = sourceX + branchDirection * horizontalSpread;
	const cp1Y = sourceY + curveHeight;

	const cp2X = targetX + branchDirection * targetOffset;
	const cp2Y = targetY - curveHeight;

	// Create symmetric cubic bezier path for both branches
	const edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;

	// Calculate label position at the peak of the curve (symmetric for both branches)
	const labelX = (sourceX + cp1X + cp2X + targetX) / 4;
	const labelY = (sourceY + cp1Y + cp2Y + targetY) / 4;

	// Enhanced styling based on condition with clear color differentiation
	const edgeStyle = {
		...style,
		stroke: '#D7D7DA', // Unified color for all conditions
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
						background: '#D7D7DA', // Unified background color
						padding: '2px 6px',
						borderRadius: '8px',
						boxShadow: '0 1px 3px rgba(215, 215, 218, 0.3)', // Unified shadow color
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
