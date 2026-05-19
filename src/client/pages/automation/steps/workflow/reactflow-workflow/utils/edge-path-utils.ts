/**
 * External dependencies
 */
import { Position } from '@xyflow/react';

type OrthogonalPathParams = {
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	sourcePosition?: Position;
	targetPosition?: Position;
};

const snap = (value: number): number => Math.round(value);

/**
 * Build a flowchart-style path using only straight line (L) segments — no curves.
 * Coordinates are snapped to whole pixels so adjacent edges share exact joints.
 */
export const getOrthogonalEdgePath = ({
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition = Position.Bottom,
	targetPosition = Position.Top,
}: OrthogonalPathParams): [path: string, labelX: number, labelY: number] => {
	const sx = snap(sourceX);
	const sy = snap(sourceY);
	const tx = snap(targetX);
	const ty = snap(targetY);

	const sameColumn = sx === tx;
	const verticalPair =
		(sourcePosition === Position.Bottom &&
			targetPosition === Position.Top) ||
		(sourcePosition === Position.Top &&
			targetPosition === Position.Bottom);

	if (sameColumn && verticalPair) {
		return [`M ${sx} ${sy} L ${tx} ${ty}`, sx, snap((sy + ty) / 2)];
	}

	// Nested merge → parent merge (target enters from yes/no side handle).
	// Keep the add-step button on the vertical drop directly below the source
	// so it appears under the last step rather than on the horizontal jog.
	if (
		sourcePosition === Position.Bottom &&
		(targetPosition === Position.Left ||
			targetPosition === Position.Right)
	) {
		const path = `M ${sx} ${sy} L ${sx} ${ty} L ${tx} ${ty}`;
		const labelY = snap(sy + (ty - sy) * 0.65);
		return [path, sx, labelY];
	}

	// Standard top-down elbow routing.
	// Place the add-step button on the vertical segment under the source so
	// the "+" sits directly below the last step, not on the horizontal jog.
	const midY = snap((sy + ty) / 2);
	const path = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
	const labelY = snap(sy + (midY - sy) * 0.5);

	return [path, sx, labelY];
};

type ConditionBranchPathParams = {
	sourceY: number;
	targetX: number;
	targetY: number;
	trunkCenterX: number;
};

/**
 * Condition → Yes/No branch: shared vertical trunk from the condition node center,
 * then a rounded elbow to the branch X, and a vertical drop to the target.
 * Renders an SVG `M ... L ... Q ... L ... Q ... L` path so the elbow has soft
 * border-radius style corners while the segments stay perfectly straight.
 */
export const getConditionBranchEdgePath = ({
	sourceY,
	targetX,
	targetY,
	trunkCenterX,
	cornerRadius = 24,
}: ConditionBranchPathParams & {
	cornerRadius?: number;
}): [path: string, labelX: number, labelY: number] => {
	const sy = snap(sourceY);
	const ty = snap(targetY);
	const tx = snap(targetX);
	const trunkX = snap(trunkCenterX);
	const junctionY = snap(sy + Math.max(40, (ty - sy) * 0.45));

	const goingRight = tx > trunkX;
	const horizontalDist = Math.abs(tx - trunkX);
	const verticalDistTop = Math.abs(junctionY - sy);
	const verticalDistBottom = Math.abs(ty - junctionY);

	// Clamp radius to half of the shortest adjacent segment so it never overshoots.
	const r = Math.max(
		0,
		Math.min(
			cornerRadius,
			horizontalDist / 2,
			verticalDistTop,
			verticalDistBottom
		)
	);

	if (r === 0 || trunkX === tx) {
		const path = `M ${trunkX} ${sy} L ${trunkX} ${junctionY} L ${tx} ${junctionY} L ${tx} ${ty}`;
		return [path, snap((trunkX + tx) / 2), junctionY];
	}

	const dir = goingRight ? 1 : -1;
	// Top corner: vertical trunk turning toward the horizontal arm.
	const topCornerStartY = junctionY - r;
	const topCornerEndX = trunkX + r * dir;
	// Bottom corner: horizontal arm turning into the vertical drop to target.
	const bottomCornerStartX = tx - r * dir;
	const bottomCornerEndY = junctionY + r;

	const path =
		`M ${trunkX} ${sy} ` +
		`L ${trunkX} ${topCornerStartY} ` +
		`Q ${trunkX} ${junctionY} ${topCornerEndX} ${junctionY} ` +
		`L ${bottomCornerStartX} ${junctionY} ` +
		`Q ${tx} ${junctionY} ${tx} ${bottomCornerEndY} ` +
		`L ${tx} ${ty}`;

	return [path, snap((trunkX + tx) / 2), junctionY];
};
