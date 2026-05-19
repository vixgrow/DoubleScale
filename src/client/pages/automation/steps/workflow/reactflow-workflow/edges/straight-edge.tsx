/**
 * External dependencies
 */
import { EdgeProps, BaseEdge, Position } from '@xyflow/react';

/**
 * Internal dependencies
 */
import { getOrthogonalEdgePath } from '../utils/edge-path-utils';

const StraightEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
}) => {
	const [edgePath] = getOrthogonalEdgePath({
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition: sourcePosition || Position.Bottom,
		targetPosition: targetPosition || Position.Top,
	});

	return (
		<BaseEdge
			id={id}
			path={edgePath}
			style={{
				...style,
				stroke: style.stroke ?? '#D7D7DA',
				strokeWidth: style.strokeWidth ?? 2,
				strokeLinecap: 'square',
				strokeLinejoin: 'miter',
				shapeRendering: 'crispEdges',
			}}
		/>
	);
};

export default StraightEdge;
