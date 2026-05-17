/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep } from '@doublescale/client';
import NodeContextMenu from '../components/node-context-menu';
import StepReorderControls from '../components/step-reorder-controls';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import EndAutomationIcon from '@doublescale/shared/icons/end-automation';

interface EndNodeData {
	step: AutomationStep;
	selectedStepId?: string | null;
	viewMode?: boolean;
}

const EndNode: React.FC<NodeProps> = ({ data }) => {
	const { step, selectedStepId, viewMode = false } = data as unknown as EndNodeData;
	const { steps, setSteps } = useAutomationContext();
	const [isDeleting, setIsDeleting] = useState(false);
	const { createNotice } = useDispatch('doublescale/core');

	const getNewSteps = () => {
		const updatedOrdersSteps = {};
		const newSteps = [...steps];

		if (step.parent_id) {
			newSteps
				.filter(
					(child) =>
						child.parent_id === step.parent_id &&
						child.condition === step.condition
				)
				.filter((s) => s.id !== step.id)
				.sort((a, b) => a.order - b.order)
				.forEach((child, index) => {
					const newOrder = index + 1;
					if (newOrder !== child.order) {
						updatedOrdersSteps[child.id] = { order: newOrder };
					}
				});
		} else {
			newSteps
				.sort((a, b) => a.order - b.order)
				.filter((s) => s.id !== step.id)
				.forEach((stepItem, index) => {
					const newOrder = index + 1;
					if (newOrder !== stepItem.order) {
						updatedOrdersSteps[stepItem.id] = { order: newOrder };
					}
				});
		}

		return { updatedOrdersSteps, newSteps };
	};

	const handleDelete = async () => {
		if (viewMode) return;

		setIsDeleting(true);

		const { newSteps, updatedOrdersSteps } = getNewSteps();

		try {
			await apiFetch({
				path: `/doublescale/v1/automation-steps/${step.id}`,
				method: 'DELETE',
				data: {
					updated_steps: updatedOrdersSteps,
				},
			});

			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);

			createNotice({
				type: 'success',
				message: __('Step deleted', 'doublescale'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const isSelected = selectedStepId === step.id.toString();

	return (
		<NodeContextMenu onDelete={viewMode ? undefined : handleDelete} disabled={viewMode}>
			<div
				className={`doublescale-reactflow-node doublescale-reactflow-node--end doublescale-reactflow-node--card-layout ${
					isSelected ? 'doublescale-reactflow-node--selected' : ''
				}`}
			>
				<Handle
					type="target"
					position={Position.Top}
					className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
				/>

				{!viewMode && <StepReorderControls step={step} />}

				<div className="doublescale-reactflow-node__card-inner">
					<div className="doublescale-reactflow-node__header-row doublescale-reactflow-node__header-row--end">
						<div className="doublescale-reactflow-node__header-left">
							<div className="doublescale-reactflow-node__icon">
								<EndAutomationIcon width={24} height={24} />
							</div>
							<div className="doublescale-reactflow-node__content">
								<div className="doublescale-reactflow-node__title">
									{__('Exit', 'doublescale')}
								</div>
							</div>
						</div>
						<NodeActionsDropdown
							onDelete={handleDelete}
							showEdit={false}
							deleteLabel={__('Delete Exit', 'doublescale')}
							deleteTitle={__('Delete this exit step?', 'doublescale')}
							deleteDescription={__(
								'This action cannot be undone.',
								'doublescale'
							)}
						/>
					</div>
				</div>
			</div>
		</NodeContextMenu>
	);
};

export default EndNode;
