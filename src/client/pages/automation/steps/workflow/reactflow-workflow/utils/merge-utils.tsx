/**
 * Merge Utilities for Workflow Management
 *
 * This file contains utility functions for handling merge node logic
 * in workflow automation, ensuring proper branch convergence and
 * continuation after condition splits.
 */

export interface MergeNodeInfo {
	id: string;
	conditionId: number;
	position: { x: number; y: number };
	yesChildCount: number;
	noChildCount: number;
	hasYesBranch: boolean;
	hasNoBranch: boolean;
}

export interface BranchConnection {
	branchType: 'yes' | 'no';
	sourceNodeId: string;
	targetHandle: 'left' | 'right' | 'top';
	edgeStyle: {
		stroke: string;
		strokeWidth: number;
	};
}

/**
 * Creates merge node connection information for condition branches
 */
export const createMergeConnections = (
	yesChildren: any[],
	noChildren: any[]
): {
	yesConnection: BranchConnection | null;
	noConnection: BranchConnection | null;
} => {
	const yesConnection: BranchConnection | null =
		yesChildren.length > 0
			? {
					branchType: 'yes',
					sourceNodeId:
						yesChildren[yesChildren.length - 1].id.toString(),
					targetHandle: 'left',
					edgeStyle: {
						stroke: '#D7D7DA',
						strokeWidth: 2,
					},
				}
			: null;

	const noConnection: BranchConnection | null =
		noChildren.length > 0
			? {
					branchType: 'no',
					sourceNodeId:
						noChildren[noChildren.length - 1].id.toString(),
					targetHandle: 'right',
					edgeStyle: {
						stroke: '#D7D7DA',
						strokeWidth: 2,
					},
				}
			: null;

	return { yesConnection, noConnection };
};

/**
 * Calculates optimal merge node position based on branch endpoints
 */
export const calculateMergePosition = (
	conditionPosition: { x: number; y: number },
	yesChildren: any[],
	noChildren: any[],
	getNodePosition: (nodeId: string) => { x: number; y: number },
	allSteps?: any[],
	level?: number,
	branchCenterX?: number
): { x: number; y: number } => {
	let maxBranchY = conditionPosition.y + 500; // Increased minimum spacing below condition

	// Helper function to recursively find the deepest descendant in a branch
	const findDeepestDescendant = (
		children: any[]
	): { y: number; x: number; nodeId?: string } => {
		if (children.length === 0) {
			return { y: conditionPosition.y + 300, x: conditionPosition.x }; // Default spacing for empty branch
		}

		let deepestY = conditionPosition.y;
		let deepestX = conditionPosition.x;
		let deepestNodeId: string | undefined;

		children.forEach((child) => {
			// Safely get child position with fallback
			let childPos;
			try {
				childPos = getNodePosition(child.id.toString());
			} catch (error) {
				// If position doesn't exist, skip this child
				console.warn(
					`Position not found for child ${child.id}, skipping...`
				);
				return;
			}

			// Check if this child is deeper than current deepest
			if (childPos && childPos.y > deepestY) {
				deepestY = childPos.y;
				deepestX = childPos.x;
				deepestNodeId = child.id.toString();
			}

			// If this child is a condition step, also check its merge node position
			if (child.type === 'condition' && allSteps && level !== undefined) {
				const childLevel = level + 1;
				const childMergeId = `merge-${child.id}-level-${childLevel}`;

				// Try to get the merge node position if it exists - but don't fail if it doesn't
				let childMergePos;
				try {
					childMergePos = getNodePosition(childMergeId);
					if (childMergePos && childMergePos.y > deepestY) {
						deepestY = childMergePos.y;
						deepestX = childMergePos.x;
						deepestNodeId = childMergeId;
					}
				} catch (error) {
					// Merge node position doesn't exist yet - this is normal during creation
					// Just continue without it
				}

				// Recursively check the children of this condition
				if (allSteps) {
					const grandYesChildren = allSteps
						.filter(
							(s) =>
								s.parent_id === child.id &&
								s.condition === 'yes'
						)
						.sort((a, b) => a.order - b.order);
					const grandNoChildren = allSteps
						.filter(
							(s) =>
								s.parent_id === child.id && s.condition === 'no'
						)
						.sort((a, b) => a.order - b.order);

					const yesDeepest = findDeepestDescendant(grandYesChildren);
					const noDeepest = findDeepestDescendant(grandNoChildren);

					if (yesDeepest.y > deepestY) {
						deepestY = yesDeepest.y;
						deepestX = yesDeepest.x;
						deepestNodeId = yesDeepest.nodeId;
					}
					if (noDeepest.y > deepestY) {
						deepestY = noDeepest.y;
						deepestX = noDeepest.x;
						deepestNodeId = noDeepest.nodeId;
					}
				}
			}
		});

		return { y: deepestY, x: deepestX, nodeId: deepestNodeId };
	};

	// Find the deepest descendant in both branches
	const yesDeepest = findDeepestDescendant(yesChildren);
	const noDeepest = findDeepestDescendant(noChildren);

	// Use the deeper of the two branches - this ensures both branches have the same effective height
	// If one branch is empty, it should still extend to match the height of the non-empty branch
	let equalizedBranchHeight = Math.max(yesDeepest.y, noDeepest.y);

	// Ensure minimum branch height even when both branches are empty
	const minimumBranchHeight = conditionPosition.y + 450; // Increased minimum for better visual balance
	equalizedBranchHeight = Math.max(
		equalizedBranchHeight,
		minimumBranchHeight
	);

	// Ensure minimum spacing below condition and below the equalized branch height
	// This ensures the merge node appears below BOTH branches, regardless of their individual heights
	maxBranchY = Math.max(
		conditionPosition.y + 700, // Increased minimum spacing below condition
		equalizedBranchHeight + 400 // Increased spacing below the equalized branch height
	);

	// Use the provided branch center X position if available, otherwise calculate it
	let centerX = branchCenterX || conditionPosition.x; // Use provided center or default to condition center

	// If no branch center was provided, calculate it from actual branch positions
	if (!branchCenterX && (yesChildren.length > 0 || noChildren.length > 0)) {
		const yesX =
			yesChildren.length > 0 ? yesDeepest.x : conditionPosition.x - 200; // Default left if empty
		const noX =
			noChildren.length > 0 ? noDeepest.x : conditionPosition.x + 200; // Default right if empty
		centerX = (yesX + noX) / 2; // True center between branches
	}

	const finalPosition = {
		x: centerX, // Center between Yes and No branches
		y: maxBranchY + 150, // Additional spacing below the equalized branches
	};

	return finalPosition;
};

/**
 * Determines if a merge node should connect to a subsequent workflow step
 */
export const shouldConnectMergeToNext = (nextSteps: any[]): boolean => {
	// Check if there are any subsequent steps after this condition
	return nextSteps.length > 0;
};

/**
 * Creates enhanced merge node data with workflow context
 */
export const createMergeNodeData = (
	conditionStep: any,
	yesChildren: any[],
	noChildren: any[]
) => {
	return {
		condition: 'merge' as const,
		parentId: conditionStep.id,
		conditionStep: conditionStep,
		yesChildCount: yesChildren.length,
		noChildCount: noChildren.length,
		hasYesBranch: yesChildren.length > 0,
		hasNoBranch: noChildren.length > 0,
		onMergeClick: () => {},
	};
};
