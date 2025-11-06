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
		onMergeClick: () => { },
	};
};
