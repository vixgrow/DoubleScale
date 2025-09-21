/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';


const initializeTrigger = (
	automation,
	steps,
	setNodes,
	setEdges,
	initialNodes,
	initialEdges,
	startX,
	startY,
	incrementY,
	nodeWidth,
	addStepWidth,
	onTriggerClick,
	savedPositions = {}
) => {
	// Always add trigger node at the top
	const triggerPosition = savedPositions['trigger'] || {
		x: startX,
		y: startY,
	};
	initialNodes.push({
		id: 'trigger',
		type: 'trigger',
		position: triggerPosition,
		data: { automation, onTriggerClick },
	});

	if (!steps || steps.length === 0) {
		const addStepPosition = savedPositions['add-step-initial'] || {
			x: triggerPosition.x + nodeWidth / 2 - addStepWidth / 2,
			y: triggerPosition.y + incrementY,
		};

		initialNodes.push({
			id: 'add-step-initial',
			type: 'add_step',
			position: addStepPosition,
			data: {
				parentId: null,
				condition: null,
				prevStep: null,
			},
		});

		initialEdges.push({
			id: 'trigger-to-add',
			source: 'trigger',
			target: 'add-step-initial',
			type: 'addStepEdge',
			data: {
				sourceStep: undefined,
				targetStep: undefined,
			},
		});

		setNodes(initialNodes);
		setEdges(initialEdges);
		return;
	}
};




function addFinalAddStep(
	steps,
	initialNodes,
	initialEdges,
	startX,
	startY,
	incrementY,
	nodeWidth,
	addStepWidth,
	savedPositions = {},
	getNodePositionLocal,
	result
) {
	// Add final add-step node for root level if needed
	const rootSteps = steps
		.filter((step) => !step.parent_id || step.parent_id === 0)
		.sort((a, b) => a.order - b.order);

	// Only add final add-step node if the last root step is not a condition or end_automation
	const lastRootStep =
		rootSteps.length > 0 ? rootSteps[rootSteps.length - 1] : null;
	const shouldAddFinalStep =
		rootSteps.length === 0 ||
		(lastRootStep &&
			lastRootStep.type !== 'end_automation' &&
			lastRootStep.type !== 'condition');

	if (shouldAddFinalStep) {
		let finalAddPosition = {};
		if (rootSteps.length === 0) {
			// No root steps, position below trigger
			const triggerPos = savedPositions['trigger'] || {
				x: startX,
				y: startY,
			};
			finalAddPosition = {
				x: triggerPos.x + nodeWidth / 2 - addStepWidth / 2,
				y: triggerPos.y + incrementY,
			};
		} else if (lastRootStep) {
			// Position based on the last root step in the main flow
			const lastRootStepPos = getNodePositionLocal(
				lastRootStep.id.toString()
			);

			finalAddPosition = {
				x: lastRootStepPos.x + nodeWidth / 2 - addStepWidth / 2,
				y: lastRootStepPos.y + incrementY,
			};
		}

		// Check for saved position for final add-step node
		const finalSavedPosition = savedPositions['add-step-final'];

		if (finalAddPosition) {
			initialNodes.push({
				id: 'add-step-final',
				type: 'add_step',
				position: finalSavedPosition || finalAddPosition,
				data: {
					parentId: null,
					condition: null,
					prevStep: lastRootStep,
				},
			});

			// Connect to last root step or trigger
			if (lastRootStep && lastRootStep.type === 'condition') {
				// For root-level condition nodes, connect from the merge node
				const mergeId = `merge-${lastRootStep.id}-level-0`; // Root level is level 0

				// Check if merge node actually exists (in case we skipped creating it)
				const mergeNodeExists = initialNodes.some(
					(node) => node.id === mergeId
				);

				if (mergeNodeExists) {
					initialEdges.push({
						id: `${mergeId}-to-add-final`,
						source: mergeId,
						target: 'add-step-final',
						type: 'addStepEdge',
						style: {
							stroke: '#D7D7DA',
							strokeWidth: 2,
						},
						data: {
							sourceStep: { id: mergeId, type: 'merge' },
							targetStep: undefined, // adding at end
							fromMerge: true,
						},
					});
				} else {
					// If no merge node, connect directly from the condition
					initialEdges.push({
						id: `${lastRootStep.id}-to-add-final`,
						source: lastRootStep.id.toString(),
						target: 'add-step-final',
						type: 'addStepEdge',
						data: {
							sourceStep: lastRootStep,
							targetStep: undefined, // adding at end
						},
					});
				}
			} else {
				// For other step types, use addStepEdge
				const sourceId = result.lastStepId || 'trigger';
				initialEdges.push({
					id: `${sourceId}-to-add-final`,
					source: sourceId,
					target: 'add-step-final',
					type: 'addStepEdge',
					data: {
						sourceStep: lastRootStep,
						targetStep: undefined, // adding at end
					},
				});
			}
		}
	}
}

export { initializeTrigger, addFinalAddStep };
