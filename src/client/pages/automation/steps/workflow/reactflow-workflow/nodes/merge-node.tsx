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
import {
	CheckOutlined,
	CloseOutlined,
	NodeIndexOutlined,
	PlusOutlined,
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Popover, Flex, Spin } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { AutomationStep } from '@quillcrm/client';
import { useAutomationContext } from '../../../../state/context';

interface MergeNodeData {
	condition: 'yes' | 'no' | 'merge';
	parentId: number;
	conditionStep?: any;
	yesChildCount?: number;
	noChildCount?: number;
	level?: number;
	onMergeClick?: () => void;
}

const MergeNode: React.FC<NodeProps> = ({ data }) => {
	const {
		condition,
		parentId,
		conditionStep,
		yesChildCount,
		noChildCount,
		level,
		onMergeClick,
	} = data as unknown as MergeNodeData;
	const isYes = condition === 'yes';
	const isMerge = condition === 'merge';
	const mergeLevel = level || 0;

	const [loading, setLoading] = useState(false);
	const [popoverVisible, setPopoverVisible] = useState(false);
	const { automation, steps, setSteps, setUpdatedSteps } =
		useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleClick = () => {
		if (onMergeClick) {
			onMergeClick();
		}
	};

	// Step types available for creation after merge
	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	const updateStepOrderRecursive = (
		steps: AutomationStep[],
		parentId: number,
		order: number,
		condition?: string
	) => {
		const updatedSteps = {};
		const newSteps = [...steps];
		let currentStepOrder = order;

		// Find steps that need to be reordered
		const stepsToUpdate = newSteps.filter((step) => {
			if (parentId === 0) {
				return !step.parent_id && step.order >= order;
			} else {
				return (
					step.parent_id === parentId &&
					step.condition === condition &&
					step.order >= order
				);
			}
		});

		// Update their orders
		stepsToUpdate.forEach((step) => {
			if (step.order >= order) {
				const newOrder = step.order + 1;
				updatedSteps[step.id] = { order: newOrder };
				step.order = newOrder;
			}
		});

		return { newSteps, updatedSteps, currentStepOrder };
	};

	const handleStepSelection = async (type: string) => {
		if (!automation) {
			console.error('No automation context available');
			return;
		}

		console.log('Merge node handleStepSelection called', {
			type,
			conditionStep,
			level,
			parentId,
			yesChildCount,
			noChildCount,
		});

		setLoading(true);

		// Steps after merge should be positioned correctly based on the merge context
		// For root-level merges, add to root level
		// For nested merges, add to the appropriate parent level
		let targetParentId = 0;
		let targetCondition = undefined;
		let targetOrder = 1;

		if (conditionStep && (level || 0) > 0) {
			// For nested merge nodes, determine the correct parent context
			// The new step should be added to the same level as the condition that created this merge
			targetParentId = conditionStep.parent_id || 0;
			targetCondition = conditionStep.condition || undefined;

			// Find steps at the same level and after this condition
			const sameLevelSteps = steps.filter((step) => {
				if (targetParentId === 0) {
					return !step.parent_id && step.order > conditionStep.order;
				} else {
					return (
						step.parent_id === targetParentId &&
						step.condition === targetCondition &&
						step.order > conditionStep.order
					);
				}
			});

			targetOrder =
				sameLevelSteps.length > 0
					? Math.min(...sameLevelSteps.map((s) => s.order))
					: Math.max(
							...steps
								.filter((step) =>
									targetParentId === 0
										? !step.parent_id
										: step.parent_id === targetParentId &&
											step.condition === targetCondition
								)
								.map((s) => s.order),
							0
						) + 1;
		} else {
			// Root level merge - add to root level
			const rootSteps = steps.filter((step) => !step.parent_id);
			targetOrder = Math.max(...rootSteps.map((s) => s.order), 0) + 1;
		}

		console.log('Calculated step placement', {
			targetParentId,
			targetCondition,
			targetOrder,
		});

		const stepData = {
			automation_id: automation.id,
			type,
			status: 'active',
			order: targetOrder,
		} as Partial<AutomationStep>;

		// Set parent and condition if this is a nested merge
		if (targetParentId > 0) {
			stepData.parent_id = targetParentId;
		}
		if (targetCondition) {
			stepData.condition = targetCondition;
		}

		// Set appropriate action based on step type
		if (type === 'condition') {
			stepData.action = 'condition';
		} else if (type === 'end_automation') {
			stepData.action = 'end_automation';
		}

		const { newSteps, updatedSteps, currentStepOrder } =
			updateStepOrderRecursive(steps, targetParentId, targetOrder);

		const requestData = {
			...stepData,
			order: currentStepOrder,
			updated_steps: updatedSteps,
		};

		console.log('Creating step with data', requestData);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data: requestData,
			})) as AutomationStep;

			console.log('Step created successfully', response);

			setUpdatedSteps({});
			setSteps([...newSteps, response]);

			createNotice({
				type: 'success',
				message: __('Step added after merge', 'quillcrm'),
			});

			setPopoverVisible(false);
		} catch (error: any) {
			console.error('Error creating step', error);
			createNotice({
				type: 'error',
				message: error.message || __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	// Add step popover click handler with proper event handling
	const handleAddStepClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('Add step clicked on merge node', {
			popoverVisible,
			isMerge,
			conditionStep,
		});
		setPopoverVisible(!popoverVisible);
	};

	// Generate a helpful tooltip for merge nodes
	const getMergeTooltip = () => {
		if (!isMerge) return '';

		const yesText =
			yesChildCount && yesChildCount > 0
				? `${yesChildCount} step${yesChildCount > 1 ? 's' : ''} in Yes branch`
				: 'Empty Yes branch';
		const noText =
			noChildCount && noChildCount > 0
				? `${noChildCount} step${noChildCount > 1 ? 's' : ''} in No branch`
				: 'Empty No branch';

		return `Merge point: ${yesText}, ${noText}`;
	};

	return (
		<div
			className={`qcrm-reactflow-node qcrm-reactflow-node--merge qcrm-reactflow-node--merge-${condition}`}
			onClick={!isMerge ? handleClick : undefined} // Only allow clicks for non-merge nodes
			title={isMerge ? getMergeTooltip() : ''}
			data-merge-level={mergeLevel}
		>
			{/* For merge nodes, we have multiple target handles */}
			{isMerge ? (
				<>
					<Handle
						type="target"
						position={Position.Left}
						id="left"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{ left: -6 }}
					/>
					<Handle
						type="target"
						position={Position.Right}
						id="right"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{ right: -6 }}
					/>
					{/* Add top handle for cases where branches merge from above */}
					<Handle
						type="target"
						position={Position.Top}
						id="top"
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
						style={{ top: -6 }}
					/>
				</>
			) : (
				<Handle
					type="target"
					position={Position.Top}
					className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
				/>
			)}

			{/* Make merge node function as add-step node */}
			{isMerge ? (
				<Popover
					placement="right"
					trigger="click"
					open={popoverVisible}
					onOpenChange={(visible) => {
						console.log('Popover visibility changed', visible);
						setPopoverVisible(visible);
					}}
					content={
						<>
							{loading && <Spin />}
							{!loading && (
								<Flex gap={10} wrap vertical>
									{map(typesOptions, (type, key) => (
										<Button
											key={key}
											icon={type.icon}
											onClick={(e) => {
												e.stopPropagation();
												console.log(
													'Button clicked',
													key
												);
												handleStepSelection(key);
											}}
											style={{
												justifyContent: 'flex-start',
											}}
										>
											{type.label}
										</Button>
									))}
								</Flex>
							)}
						</>
					}
					overlayStyle={{ zIndex: 9999 }}
					destroyTooltipOnHide
				>
					<div
						className="qcrm-reactflow-merge__content qcrm-reactflow-merge__add-step-content"
						onClick={handleAddStepClick}
						title={__('Add step after merge', 'quillcrm')}
						style={{ cursor: 'pointer' }}
					>
						<div className="qcrm-reactflow-merge__icon">
							<PlusOutlined style={{ fontSize: '18px' }} />
						</div>
						<div className="qcrm-reactflow-merge__label">
							{__('Add Step', 'quillcrm')}
						</div>
					</div>
				</Popover>
			) : (
				<div className="qcrm-reactflow-merge__content">
					<div className="qcrm-reactflow-merge__icon">
						{isYes ? <CheckOutlined /> : <CloseOutlined />}
					</div>
					<div className="qcrm-reactflow-merge__label">
						{isYes ? __('Yes', 'quillcrm') : __('No', 'quillcrm')}
					</div>
				</div>
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
				style={{ bottom: -6 }}
			/>
		</div>
	);
};

export default MergeNode;
