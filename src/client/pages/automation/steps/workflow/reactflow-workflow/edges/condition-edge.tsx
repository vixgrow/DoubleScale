/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { EdgeProps, BaseEdge, getSmoothStepPath } from '@xyflow/react';

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
	label,
}) => {
	const edgeData = data as ConditionEdgeData;
	const condition = edgeData?.condition || (label === 'Yes' ? 'yes' : 'no');

	// Use React Flow's built-in smooth step edge with explicit positions
	const [edgePath] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		borderRadius: 8,
	});

	// Enhanced styling based on condition with clear color differentiation
	const edgeStyle = {
		...style,
		stroke: '#D7D7DA', // Unified color for all conditions
		strokeWidth: 2, // Thickness for step edges
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		transition: 'all 0.2s ease',
	};

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={edgeStyle}
				className={`qcrm-condition-edge qcrm-condition-edge--${condition}`}
			/>
		</>
	);
};

export default ConditionEdge;
