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
						stroke: '#52c41a',
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
						stroke: '#ff4d4f',
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
	getNodePosition: (nodeId: string) => { x: number; y: number }
): { x: number; y: number } => {
	let maxBranchY = conditionPosition.y + 500; // Increased minimum spacing below condition

	// Check deepest position in both branches
	if (yesChildren.length > 0) {
		const lastYesChild = yesChildren[yesChildren.length - 1];
		const lastYesPos = getNodePosition(lastYesChild.id.toString());
		maxBranchY = Math.max(maxBranchY, lastYesPos.y + 200); // Increased spacing after last child
	}

	if (noChildren.length > 0) {
		const lastNoChild = noChildren[noChildren.length - 1];
		const lastNoPos = getNodePosition(lastNoChild.id.toString());
		maxBranchY = Math.max(maxBranchY, lastNoPos.y + 200); // Increased spacing after last child
	}

	return {
		x: conditionPosition.x, // Center below condition
		y: maxBranchY + 100, // Increased spacing below the longest branch
	};
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
		onMergeClick: () => {
			console.log(
				`Merge node clicked for condition ${conditionStep.id}`,
				{
					yesSteps: yesChildren.length,
					noSteps: noChildren.length,
					conditionStep: conditionStep,
				}
			);
		},
	};
};

/**
 * Validates merge node configuration
 */
export const validateMergeConfiguration = (
	mergeData: any
): { isValid: boolean; warnings: string[] } => {
	const warnings: string[] = [];
	let isValid = true;

	if (!mergeData.hasYesBranch && !mergeData.hasNoBranch) {
		warnings.push(
			'Both branches are empty - consider simplifying the condition'
		);
		isValid = false;
	}

	if (mergeData.hasYesBranch && !mergeData.hasNoBranch) {
		warnings.push(
			'No branch is empty - consider adding steps or removing the condition'
		);
	}

	if (!mergeData.hasYesBranch && mergeData.hasNoBranch) {
		warnings.push(
			'Yes branch is empty - consider adding steps or inverting the condition'
		);
	}

	return { isValid, warnings };
};
