/**
 * External dependencies
 */
import { EdgeProps, BaseEdge } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@doublescale/client';
import { getConditionBranchEdgePath } from '../utils/edge-path-utils';

interface ConditionEdgeData {
	sourceStep?: AutomationStep;
	targetStep?: AutomationStep;
	condition?: 'yes' | 'no';
	trunkCenterX?: number;
	label?: string;
}

const ConditionEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	style = {},
	data,
	label,
}) => {
	const edgeData = data as ConditionEdgeData;
	const condition = edgeData?.condition || (label === 'Yes' ? 'yes' : 'no');
	const trunkCenterX = edgeData?.trunkCenterX ?? sourceX;

	const [edgePath] = getConditionBranchEdgePath({
		sourceY,
		targetX,
		targetY,
		trunkCenterX,
	});

	const edgeStyle = {
		...style,
		stroke: '#D7D7DA',
		strokeWidth: style.strokeWidth ?? 2,
		strokeLinecap: 'square' as const,
		strokeLinejoin: 'miter' as const,
		shapeRendering: 'crispEdges' as const,
	};

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={edgeStyle}
				className={`doublescale-condition-edge doublescale-condition-edge--${condition}`}
			/>
		</>
	);
};

export default ConditionEdge;