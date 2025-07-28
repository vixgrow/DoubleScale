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
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Popconfirm, type MenuProps } from 'antd';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import type { AutomationStep, OrganizedStep } from '@quillcrm/client';
import { getGoal } from '@quillcrm/utils';
import NodeContextMenu from '../components/node-context-menu';
import StepReorderControls from '../components/step-reorder-controls';

interface GoalNodeData {
	step: AutomationStep;
	onStepClick?: (step: OrganizedStep) => void;
	clearSavedPositions?: () => void;
}

const GoalNode: React.FC<NodeProps> = ({ data }) => {
	const { step, onStepClick, clearSavedPositions } =
		data as unknown as GoalNodeData;
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const goal = step.action ? getGoal(step.action) : null;
	const hasGoal = !!step.action;

	const GoalIcon = () => (
		<svg
			width="28"
			height="29"
			viewBox="0 0 28 29"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.9972 1.95801C14.9277 1.95801 15.5991 2.65766 15.9931 3.45582L17.2278 5.94569C17.2278 5.94569 17.2307 5.95133 17.2372 5.96093C17.2443 5.97118 17.2546 5.98459 17.2686 6.00045C17.2973 6.03286 17.3357 6.06849 17.3812 6.10235C17.4267 6.13618 17.4722 6.16297 17.5122 6.18155C17.5318 6.19064 17.548 6.19685 17.5604 6.20087C17.5665 6.20284 17.5712 6.20416 17.5746 6.205L17.5796 6.20611L19.8124 6.58013C20.6806 6.72603 21.5133 7.17085 21.7898 8.03823C22.0659 8.9045 21.6462 9.74989 21.0226 10.3749L21.0214 10.376L19.2878 12.1241C19.2712 12.1408 19.2186 12.2138 19.1818 12.3432C19.1459 12.4701 19.15 12.5632 19.1564 12.594L19.6525 14.7568C19.8648 15.6859 19.8363 16.7777 19.0211 17.3769C18.2022 17.9788 17.1522 17.6716 16.3353 17.1851L14.8751 16.3136V20.6247H15.2244C16 20.6247 16.6684 20.6246 17.2035 20.6965C17.7772 20.7737 18.3269 20.9476 18.7729 21.3935C19.2188 21.8395 19.3928 22.3893 19.4699 22.9629C19.5299 23.4089 19.5398 23.9473 19.5414 24.5633L19.5417 25.2913H21.0001C21.4833 25.2913 21.8751 25.6831 21.8751 26.1663C21.8751 26.6496 21.4833 27.0413 21.0001 27.0413H7.00008C6.51683 27.0413 6.12508 26.6496 6.12508 26.1663C6.12508 25.6831 6.51683 25.2913 7.00008 25.2913H8.45841V24.942C8.45837 24.1664 8.45833 23.4981 8.53029 22.9629C8.60741 22.3893 8.78131 21.8395 9.22726 21.3935C9.67322 20.9476 10.223 20.7737 10.7966 20.6965C11.2426 20.6366 11.7811 20.6266 12.397 20.625L13.1251 20.6247V16.311L11.6612 17.1848C10.8436 17.6739 9.79546 17.9761 8.97722 17.3741C8.16328 16.7753 8.13019 15.6863 8.34371 14.756L8.83961 12.594C8.84596 12.5634 8.85016 12.4701 8.81412 12.3432C8.77737 12.2138 8.72484 12.1408 8.70825 12.1241L6.97245 10.3739C6.35267 9.74902 5.93448 8.90455 6.20836 8.03981C6.48328 7.17172 7.31495 6.7261 8.18406 6.58006L10.4137 6.20655C10.4137 6.20655 10.4201 6.2052 10.4299 6.20198C10.4416 6.19812 10.4574 6.19204 10.4767 6.18299C10.5161 6.16447 10.5615 6.13763 10.607 6.10356C10.6526 6.0695 10.6911 6.03362 10.72 6.00094C10.7342 5.98496 10.7445 5.97143 10.7516 5.96109C10.7588 5.95068 10.7612 5.94569 10.7612 5.94569L10.7644 5.93928L11.997 3.45356C12.3945 2.65628 13.0678 1.95801 13.9972 1.95801ZM15.6904 22.3755H12.3098C11.7468 22.3781 11.3445 22.3886 11.0298 22.4309C10.6503 22.482 10.5313 22.5644 10.4647 22.631C10.3981 22.6976 10.3157 22.8165 10.2647 23.196C10.2103 23.6007 10.2084 24.15 10.2084 24.9997V25.2913H17.7917L17.7909 24.476C17.7883 23.913 17.7778 23.5108 17.7355 23.196C17.6844 22.8165 17.602 22.6976 17.5354 22.631C17.4688 22.5644 17.3499 22.482 16.9704 22.4309C16.6556 22.3886 16.2534 22.3781 15.6904 22.3755ZM13.9969 3.70997C13.9594 3.72162 13.7821 3.79543 13.5633 4.2343L12.3335 6.71405C12.1718 7.04486 11.9103 7.31416 11.6549 7.50518C11.3986 7.69675 11.0674 7.8701 10.709 7.93146L10.7059 7.93199L8.47363 8.30593C8.2085 8.35049 8.0482 8.424 7.96226 8.48288C7.9207 8.51136 7.89918 8.53446 7.889 8.5475C7.87938 8.55982 7.87668 8.56819 7.87668 8.56819C7.87668 8.56819 7.87389 8.57725 7.87469 8.59414C7.87553 8.61193 7.88006 8.64466 7.89799 8.69349C7.93501 8.79429 8.02449 8.94954 8.21496 9.14158L9.95078 10.8917C10.2282 11.1714 10.4031 11.5325 10.4976 11.8652C10.5922 12.1987 10.6321 12.5951 10.5476 12.9751L10.5463 12.9809L10.0494 15.1474C9.96876 15.4987 9.97062 15.7342 9.99583 15.8703C10.0035 15.9116 10.0121 15.939 10.0191 15.9563C10.0366 15.9574 10.0631 15.9571 10.101 15.9523C10.2343 15.9355 10.4557 15.8668 10.763 15.6829L12.8623 14.4299C13.2198 14.2201 13.6339 14.1402 14.0007 14.1402C14.3664 14.1402 14.782 14.2199 15.1393 14.4333L17.2314 15.682C17.5413 15.8664 17.7649 15.9363 17.8994 15.9535C17.9357 15.9582 17.9615 15.9587 17.9791 15.9579C17.9856 15.9406 17.9937 15.914 18.0008 15.8751C18.0259 15.7382 18.0274 15.5013 17.9466 15.1474L17.4484 12.9751C17.3638 12.5951 17.4037 12.1987 17.4984 11.8652C17.5929 11.5325 17.7678 11.1714 18.0453 10.8917L19.781 9.14158C19.9749 8.9474 20.0644 8.79247 20.1013 8.69253C20.1191 8.64414 20.1236 8.6119 20.1245 8.59465C20.1251 8.57832 20.1224 8.56976 20.1224 8.56976C20.1224 8.56976 20.1197 8.56143 20.1099 8.54885C20.0995 8.53556 20.0776 8.51218 20.0356 8.48347C19.9487 8.42413 19.7876 8.35051 19.5224 8.30593L17.2901 7.93198C16.9291 7.87133 16.5953 7.69887 16.3367 7.50641C16.0792 7.31484 15.8173 7.04518 15.6555 6.71413L14.425 4.23267C14.2093 3.7954 14.0347 3.72179 13.9969 3.70997Z"
				fill="currentColor"
			/>
		</svg>
	);

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

	const handleDelete = async () => {
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

	// Create dropdown menu items
	const menuItems: MenuProps['items'] = [
		{
			key: 'edit',
			label: __('Edit Goal', 'quillcrm'),
			icon: <EditOutlined />,
			onClick: () => handleEdit(),
		},
		{
			key: 'delete',
			label: (
				<Popconfirm
					title={__('Delete this goal?', 'quillcrm')}
					description={__(
						'This will remove the goal from your workflow.',
						'quillcrm'
					)}
					onConfirm={handleDelete}
					okText={__('Delete', 'quillcrm')}
					cancelText={__('Cancel', 'quillcrm')}
					okButtonProps={{ danger: true }}
				>
					<span style={{ color: '#ff4d4f' }}>
						<DeleteOutlined style={{ marginRight: 8 }} />
						{__('Delete Goal', 'quillcrm')}
					</span>
				</Popconfirm>
			),
		},
	];

	return (
		<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--goal">
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
					<GoalIcon />
				</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
					<div className="qcrm-reactflow-node__title">
						{__('Goal', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{hasGoal ? (
							<span className="qcrm-reactflow-goal__configured">
								{goal?.label}
							</span>
						) : (
							<span className="qcrm-reactflow-goal__not-configured">
								{__('Goal not set', 'quillcrm')}
							</span>
						)}
					</div>
				</div>

				{/* Three dots dropdown menu */}
				<div
					className="qcrm-reactflow-node__actions"
					style={{
						position: 'absolute',
						top: '50%',
						right: '16px',
						transform: 'translateY(-50%)',
						zIndex: 10,
						width: '40px',
						height: '40px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Dropdown
						menu={{ items: menuItems }}
						trigger={['click']}
						placement="bottomRight"
					>
						<Button
							type="text"
							size="small"
							icon={<MoreOutlined />}
							onClick={(e) => e.stopPropagation()}
							style={{
								background: 'transparent',
								border: 'none',
								color: '#8c8c8c',
								padding: '6px',
								height: '32px',
								width: '32px',
								boxShadow: 'none',
								borderRadius: '6px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						/>
					</Dropdown>
				</div>

				<Handle
					type="source"
					position={Position.Bottom}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				/>
			</div>
		</NodeContextMenu>
	);
};

export default GoalNode;
