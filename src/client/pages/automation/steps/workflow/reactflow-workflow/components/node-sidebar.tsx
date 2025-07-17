/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	RocketOutlined,
	ThunderboltOutlined,
	BranchesOutlined,
	TrophyOutlined,
	DisconnectOutlined,
	PlusCircleOutlined,
	EditOutlined,
} from '@ant-design/icons';
import { Button, List, Typography, Space, Badge, Tooltip } from 'antd';
import { Node } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type {
	AutomationStep,
	OrganizedStep,
	Automation,
} from '@quillcrm/client';
import { getTrigger } from '@quillcrm/utils';

const { Title, Text } = Typography;

interface NodeSidebarProps {
	nodes: Node[];
	steps?: AutomationStep[];
	onNodeClick?: (nodeId: string) => void;
	onStepClick?: (step: OrganizedStep) => void;
	onTriggerClick?: () => void;
}

const NodeSidebar: React.FC<NodeSidebarProps> = ({
	nodes,
	steps = [],
	onNodeClick,
	onStepClick,
	onTriggerClick,
}) => {
	// Get the icon for each node type
	const getNodeIcon = (nodeType: string) => {
		switch (nodeType) {
			case 'trigger':
				return <RocketOutlined style={{ color: '#1890ff' }} />;
			case 'action':
				return <ThunderboltOutlined style={{ color: '#52c41a' }} />;
			case 'condition':
				return <BranchesOutlined style={{ color: '#faad14' }} />;
			case 'goal':
				return <TrophyOutlined style={{ color: '#722ed1' }} />;
			case 'end_automation':
				return <DisconnectOutlined style={{ color: '#f5222d' }} />;
			case 'add_step':
				return <PlusCircleOutlined style={{ color: '#d9d9d9' }} />;
			default:
				return <ThunderboltOutlined style={{ color: '#666' }} />;
		}
	};

	// Get the display name for each node type
	const getNodeName = (node: Node) => {
		switch (node.type) {
			case 'trigger': {
				// Get trigger information from node data
				const automation = node.data?.automation as Automation;
				if (automation?.trigger) {
					const trigger = getTrigger(automation.trigger);
					return trigger?.label || __('Trigger', 'quillcrm');
				}
				return __('Trigger', 'quillcrm');
			}
			case 'action': {
				const step = steps.find((s) => s.id.toString() === node.id);
				if (step?.action) {
					// Convert snake_case to readable format
					const actionName = step.action
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (l) => l.toUpperCase());
					return actionName;
				}
				return __('Action', 'quillcrm');
			}
			case 'condition': {
				const step = steps.find((s) => s.id.toString() === node.id);
				if (step?.action) {
					const conditionName = step.action
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (l) => l.toUpperCase());
					return conditionName;
				}
				return __('Condition', 'quillcrm');
			}
			case 'goal': {
				const step = steps.find((s) => s.id.toString() === node.id);
				if (step?.action) {
					const goalName = step.action
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (l) => l.toUpperCase());
					return goalName;
				}
				return __('Goal', 'quillcrm');
			}
			case 'end_automation':
				return __('End Automation', 'quillcrm');
			case 'add_step':
				return __('Add Step', 'quillcrm');
			default:
				return __('Unknown', 'quillcrm');
		}
	};

	// Get the node status/color based on type
	const getNodeStatus = (nodeType: string) => {
		switch (nodeType) {
			case 'trigger':
				return 'processing';
			case 'action':
				return 'success';
			case 'condition':
				return 'warning';
			case 'goal':
				return 'processing'; // Changed from 'purple' to valid type
			case 'end_automation':
				return 'error';
			case 'add_step':
				return 'default';
			default:
				return 'default';
		}
	};

	// Handle node click
	const handleNodeClick = useCallback(
		(node: Node) => {
			if (node.id === 'trigger' && onTriggerClick) {
				onTriggerClick();
			} else if (!node.id.startsWith('add-step') && onStepClick) {
				// Find the step data
				const step = steps.find((s) => s.id.toString() === node.id);
				if (step) {
					onStepClick({
						...step,
						children: [], // Will be populated if needed by the consuming component
					});
				}
			}

			// Also trigger focus on the node in the canvas
			if (onNodeClick) {
				onNodeClick(node.id);
			}
		},
		[onNodeClick, onStepClick, onTriggerClick, steps]
	);

	// Filter out add-step nodes and sort remaining nodes
	const displayNodes = nodes
		.filter((node) => !node.id.startsWith('add-step'))
		.sort((a, b) => {
			// Always put trigger first
			if (a.type === 'trigger') return -1;
			if (b.type === 'trigger') return 1;

			// Then sort by position Y coordinate (top to bottom)
			return a.position.y - b.position.y;
		});

	return (
		<div className="qcrm-node-sidebar">
			<div className="qcrm-node-sidebar__header">
				<Title level={5} style={{ margin: 0 }}>
					{__('Workflow Nodes', 'quillcrm')}
				</Title>
				<Badge
					count={displayNodes.length}
					style={{ backgroundColor: '#1890ff' }}
				/>
			</div>

			<div className="qcrm-node-sidebar__content">
				{displayNodes.length === 0 ? (
					<div className="qcrm-node-sidebar__empty">
						<Text type="secondary">
							{__('No nodes created yet', 'quillcrm')}
						</Text>
					</div>
				) : (
					<List
						size="small"
						dataSource={displayNodes}
						renderItem={(node) => (
							<List.Item
								className="qcrm-node-sidebar__item"
								onClick={(e) => {
									e.stopPropagation();
									if (onNodeClick) {
										onNodeClick(node.id);
									}
								}}
							>
								<List.Item.Meta
									avatar={getNodeIcon(node.type || 'default')}
									title={
										<Space>
											<Text
												ellipsis
												style={{ maxWidth: 120 }}
											>
												{getNodeName(node)}
											</Text>
											<Badge
												status={getNodeStatus(
													node.type || 'default'
												)}
												size="small"
											/>
										</Space>
									}
									description={
										<Text
											type="secondary"
											style={{ fontSize: 11 }}
										>
											{node.type === 'trigger'
												? __(
														'Workflow start',
														'quillcrm'
													)
												: `${__('Step', 'quillcrm')} #${node.id}`}
										</Text>
									}
								/>
								<Tooltip
									title={__('Focus on canvas', 'quillcrm')}
								>
									{node.type !== 'end_automation' && (
										<Button
											type="text"
											size="small"
											icon={<EditOutlined />}
											onClick={() =>
												handleNodeClick(node)
											}
										/>
									)}
								</Tooltip>
							</List.Item>
						)}
					/>
				)}
			</div>
		</div>
	);
};

export default NodeSidebar;
