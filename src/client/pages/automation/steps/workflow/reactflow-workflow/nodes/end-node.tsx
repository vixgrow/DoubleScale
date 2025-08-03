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
import { PoweroffOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import StepReorderControls from '../components/step-reorder-controls';
import NodeActionsDropdown from '../components/node-actions-dropdown';

interface EndNodeData {
	step: AutomationStep;
}

const EndNode: React.FC<NodeProps> = ({ data }) => {
	const { step } = data as unknown as EndNodeData;
	const { steps, setSteps } = useAutomationContext();
	const [isDeleting, setIsDeleting] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const endIcon = () => {
		return <PoweroffOutlined />;
	};

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
		setIsDeleting(true);

		const { newSteps, updatedOrdersSteps } = getNewSteps();

		try {
			await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'DELETE',
				data: {
					updated_steps: updatedOrdersSteps,
				},
			});

			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);

			createNotice({
				type: 'success',
				message: __('Step deleted', 'quillcrm'),
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

	return (
		<NodeContextMenu onDelete={handleDelete} disabled={false}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--end">
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls */}
				<StepReorderControls step={step} />

				<div className="qcrm-reactflow-node__icon">{endIcon()}</div>

				{/* Three dots dropdown menu */}
				<NodeActionsDropdown
					onDelete={handleDelete}
					showEdit={false}
					deleteLabel={__('Delete End Node', 'quillcrm')}
					deleteTitle={__('Delete this end node?', 'quillcrm')}
					deleteDescription={__(
						'This action cannot be undone.',
						'quillcrm'
					)}
				/>

				<div className="qcrm-reactflow-node__content">
					<div className="qcrm-reactflow-node__title">
						{__('End Automation', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{__('Stop', 'quillcrm')}
					</div>
				</div>
			</div>
		</NodeContextMenu>
	);
};

export default EndNode;
