/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import StepReorderControls from '../components/step-reorder-controls';

interface ConditionNodeData {
	step: AutomationStep;
	onStepClick?: (step: OrganizedStep) => void;
	clearSavedPositions?: () => void;
}

const ConditionNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick, clearSavedPositions } =
		data as unknown as ConditionNodeData;
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleEdit = () => {
		if (onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
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

	const handleDeleteStep = async () => {
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
		}
	};

	// Check if condition is configured
	const isConfigured = step.settings?.condition_name;

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDeleteStep}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--condition">
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>

				{/* Step Reorder Controls */}
				<StepReorderControls
					step={step}
					clearSavedPositions={clearSavedPositions}
				/>

				<div className="qcrm-reactflow-node__icon">
					<svg
						width="28"
						height="28"
						viewBox="0 0 28 28"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="qcrm-reactflow-condition__workflow-icon"
					>
						<path
							d="M4.66699 20.125C6.43865 20.1252 7.87482 21.5614 7.875 23.333C7.875 25.1048 6.43876 26.5418 4.66699 26.542C2.89508 26.542 1.45801 25.1049 1.45801 23.333C1.45818 21.5612 2.89519 20.125 4.66699 20.125ZM14 20.125C15.7718 20.125 17.2078 21.5612 17.208 23.333C17.208 25.1049 15.7719 26.542 14 26.542C12.2281 26.542 10.792 25.1049 10.792 23.333C10.7922 21.5612 12.2282 20.125 14 20.125ZM23.333 20.125C25.1048 20.125 26.5418 21.5612 26.542 23.333C26.542 25.1049 25.1049 26.542 23.333 26.542C21.5612 26.5418 20.125 25.1048 20.125 23.333C20.1252 21.5614 21.5614 20.1252 23.333 20.125ZM4.66699 21.875C3.86169 21.875 3.20818 22.5277 3.20801 23.333C3.20801 24.1384 3.86158 24.792 4.66699 24.792C5.47226 24.7918 6.125 24.1383 6.125 23.333C6.12482 22.5279 5.47215 21.8752 4.66699 21.875ZM14 21.875C13.1947 21.875 12.5422 22.5277 12.542 23.333C12.542 24.1384 13.1946 24.792 14 24.792C14.8054 24.792 15.458 24.1384 15.458 23.333C15.4578 22.5277 14.8053 21.875 14 21.875ZM23.333 21.875C22.5279 21.8752 21.8752 22.5279 21.875 23.333C21.875 24.1383 22.5277 24.7918 23.333 24.792C24.1384 24.792 24.792 24.1384 24.792 23.333C24.7918 22.5277 24.1383 21.875 23.333 21.875ZM14 11.958C14.4831 11.958 14.8748 12.3499 14.875 12.833V14.292H20.417C22.3187 14.2921 24.208 15.5561 24.208 17.5C24.208 17.9832 23.8163 18.375 23.333 18.375C22.8499 18.3748 22.458 17.9831 22.458 17.5C22.458 16.8667 21.7367 16.0421 20.417 16.042H14.875V17.5C14.875 17.9832 14.4832 18.375 14 18.375C13.5168 18.375 13.125 17.9832 13.125 17.5V16.042H7.58301C6.26334 16.0421 5.54199 16.8667 5.54199 17.5C5.54199 17.9831 5.15009 18.3748 4.66699 18.375C4.18374 18.375 3.79199 17.9832 3.79199 17.5C3.79199 15.5561 5.68133 14.2921 7.58301 14.292H13.125V12.833C13.1252 12.3499 13.5169 11.958 14 11.958ZM14 1.45801C16.4161 1.45801 18.3748 3.41691 18.375 5.83301C18.375 8.24925 16.4162 10.208 14 10.208C11.5838 10.208 9.625 8.24925 9.625 5.83301C9.62518 3.41691 11.5839 1.45801 14 1.45801ZM14 3.20801C12.5504 3.20801 11.3752 4.38341 11.375 5.83301C11.375 7.28275 12.5503 8.45801 14 8.45801C15.4497 8.45801 16.625 7.28275 16.625 5.83301C16.6248 4.38341 15.4496 3.20801 14 3.20801Z"
							fill="currentColor"
						/>
					</svg>
				</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="qcrm-reactflow-node__title">
						{__('Condition', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{isConfigured ? (
							<span className="qcrm-reactflow-condition__configured">
								{step.settings?.condition_name}
							</span>
						) : (
							<span className="qcrm-reactflow-condition__not-configured">
								{__('Not Configured', 'quillcrm')}
							</span>
						)}
					</div>
				</div>

				{/* Three dots dropdown menu */}
				<NodeActionsDropdown
					onEdit={handleEdit}
					onDelete={handleDeleteStep}
					editLabel={__('Edit Condition', 'quillcrm')}
					deleteLabel={__('Delete Condition', 'quillcrm')}
					deleteTitle={__('Delete this condition?', 'quillcrm')}
					deleteDescription={__(
						'This will also remove all connected steps in both branches.',
						'quillcrm'
					)}
				/>

				{/* Separate source handles for yes and no branches */}
				<Handle
					type="source"
					position={Position.Bottom}
					id="yes"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					id="no"
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default ConditionNode;
