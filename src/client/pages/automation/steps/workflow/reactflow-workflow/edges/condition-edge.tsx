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

	// Create wider, more semantic curves for clear visual separation
	let adjustedSourceX = sourceX;
	let adjustedTargetX = targetX;
	let adjustedSourceY = sourceY;

	// Create semantic directional curves from single handle
	const verticalOffset = 80; // Vertical offset for dramatic curves
	const sourceSpread = 120; // How much to spread the curves at the source
	const semanticOffset = Math.max(150, horizontalDistance * 0.6);

	if (isYes) {
		// Yes branch: Always curve LEFT regardless of target position
		adjustedSourceX = sourceX - sourceSpread; // Start left from center
		adjustedTargetX =
			targetX < sourceX ? targetX : targetX - semanticOffset; // Ensure left positioning
		adjustedSourceY = sourceY + verticalOffset;
	} else {
		// No branch: Always curve RIGHT regardless of target position
		adjustedSourceX = sourceX + sourceSpread; // Start right from center
		adjustedTargetX =
			targetX > sourceX ? targetX : targetX + semanticOffset; // Ensure right positioning
		adjustedSourceY = sourceY + verticalOffset;
	}

	// Use higher curvature for more pronounced, semantic curves from single point
	const dynamicCurvature = Math.min(1.2, 0.8 + horizontalDistance / 300);

	// Create custom path that starts from center handle and branches out
	const controlPointOffset = 60; // Distance from source to first control point
	const branchDirection = isYes ? -1 : 1; // Left for Yes, Right for No

	// First control point: slight offset from center handle
	const cp1X = sourceX + branchDirection * 30;
	const cp1Y = sourceY + controlPointOffset;

	// Second control point: more dramatic branching
	const cp2X = adjustedTargetX;
	const cp2Y = targetY - 60;

	// Create custom cubic bezier path from center to target with proper branching
	const edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${adjustedTargetX} ${targetY - 10}`;

	// Calculate label position at midpoint of curve
	const labelX = (sourceX + cp1X + cp2X + adjustedTargetX) / 4;
	const labelY = (sourceY + cp1Y + cp2Y + (targetY - 10)) / 4; // Enhanced styling based on condition with clear color differentiation
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
