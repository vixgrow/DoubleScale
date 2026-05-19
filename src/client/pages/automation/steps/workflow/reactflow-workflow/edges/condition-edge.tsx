/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { EdgeProps, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

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

const BRANCH_COLORS = {
	yes: '#22c55e', // tailwind green-500
	no: '#ef4444', // tailwind red-500
} as const;

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
	const color = BRANCH_COLORS[condition];
	const markerId = `doublescale-cond-arrow-${condition}-${id}`;

	// Stop the path just above the target so the arrow tip lands cleanly on
	// the target's top edge rather than overlapping the next node's chrome.
	const arrowGap = 8;
	const adjustedTargetY = Math.max(sourceY + 1, targetY - arrowGap);

	const [edgePath] = getConditionBranchEdgePath({
		sourceY,
		targetX,
		targetY: adjustedTargetY,
		trunkCenterX,
	});

	// Place the Yes/No badge on the vertical drop segment of the branch
	// (below the elbow, above the target arrow) so it visually belongs to
	// that specific branch rather than the shared trunk.
	const junctionY = sourceY + Math.max(40, (adjustedTargetY - sourceY) * 0.45);
	const badgeX = targetX;
	const badgeY = junctionY + (adjustedTargetY - junctionY) * 0.45;
	const badgeLabel = condition === 'yes'
		? __('Yes', 'doublescale')
		: __('No', 'doublescale');

	const edgeStyle = {
		...style,
		stroke: color,
		strokeWidth: style.strokeWidth ?? 2,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		fill: 'none' as const,
	};

	return (
		<>
			<defs>
				<marker
					id={markerId}
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="8"
					markerHeight="8"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
				</marker>
			</defs>
			<BaseEdge
				id={id}
				path={edgePath}
				style={edgeStyle}
				markerEnd={`url(#${markerId})`}
				className={`doublescale-condition-edge doublescale-condition-edge--${condition}`}
			/>
			<EdgeLabelRenderer>
				<div
					className={`doublescale-condition-edge__badge doublescale-condition-edge__badge--${condition}`}
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${badgeX}px, ${badgeY}px)`,
						pointerEvents: 'all',
						background: '#ffffff',
						color,
						border: `1px solid ${color}`,
						borderRadius: 6,
						padding: '2px 8px',
						fontSize: 11,
						fontWeight: 600,
						lineHeight: 1.2,
						letterSpacing: 0.2,
						boxShadow: `0 1px 2px ${color}33`,
						userSelect: 'none',
						whiteSpace: 'nowrap',
					}}
				>
					{badgeLabel}
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

export default ConditionEdge;
