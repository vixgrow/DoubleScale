/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import type {
	AutomationStep,
	Automation,
	OrganizedStep,
} from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import StepReorderControls from '../components/step-reorder-controls';
import AnalyticsPopup from '../components/analytics-popup';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { getAction } from '@quillcrm/utils';
import { ActionIcon, ViewIcon } from '@quillcrm/components';

interface ActionNodeData {
	step: AutomationStep;
	automation: Automation;
	selectedStepId?: string | null;
	onStepClick?: (step: OrganizedStep) => void;
	onDeleteStep?: (stepId: string) => void;
}

const ActionNode: React.FC<NodeProps> = (props) => {
	const { data } = props;
	const { step, onStepClick, selectedStepId } = data as unknown as ActionNodeData;

	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');
	const [showAnalytics, setShowAnalytics] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<any>(null);
	const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

	// Check if action is configured - an action is configured if it has an action slug
	const isConfigured = !!step.action;

	// Get action details for display
	const actionData = isConfigured ? getAction(step.action) : null;
	const actionName = actionData?.label || step.action;

	// Check if this action supports analytics (send_email, send_sms, send_whatsapp)
	const supportsAnalytics = ['send_email', 'send_sms', 'send_whatsapp'].includes(step.action || '');

	// Get action type for analytics
	const getActionType = (): 'email' | 'sms' | 'whatsapp' => {
		if (step.action === 'send_email') return 'email';
		if (step.action === 'send_sms') return 'sms';
		if (step.action === 'send_whatsapp') return 'whatsapp';
		return 'email';
	};

	// Get recipient info for display
	const getRecipientInfo = () => {
		if (!isConfigured || !supportsAnalytics) return null;

		// This would come from step configuration in real implementation
		// For now, showing placeholder
		return __('To: (100 contacts)', 'quillcrm');
	};

	const subtitle = isConfigured ? (
		<>
			<span className="qcrm-reactflow-action__configured">{actionName}</span>
			{supportsAnalytics && (
				<div className="qcrm-reactflow-action__recipient">
					{getRecipientInfo()}
				</div>
			)}
		</>
	) : (
		<span className="qcrm-reactflow-action__not-configured">
			{__('Not Configured', 'quillcrm')}
		</span>
	);

	const handleEdit = () => {
		if (onStepClick) {
			onStepClick({
				...step,
				children: [], // Will be populated if needed by the consuming component
			});
		}
	};

	const handleDelete = async () => {
		await deleteStep(step.id.toString(), steps, setSteps, createNotice);
	};

	// Check if this node is selected
	const isSelected = selectedStepId === step.id.toString();

	const handleViewAnalytics = async (e: React.MouseEvent) => {
		e.stopPropagation();

		setIsLoadingAnalytics(true);
		try {
			const response = await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}/analytics`,
				method: 'GET',
			});

			setAnalyticsData(response);
			setShowAnalytics(true);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __(
					'Failed to load analytics. Please try again.',
					'quillcrm'
				),
			});
			console.error('Analytics fetch error:', error);
		} finally {
			setIsLoadingAnalytics(false);
		}
	};

	return (
		<>
			<NodeContextMenu onEdit={handleEdit} onDelete={handleDelete}>
				<div className={`qcrm-reactflow-node qcrm-reactflow-node--action ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${supportsAnalytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}>
					<Handle
						type="target"
						position={Position.Top}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
					/>

					{/* Step Reorder Controls */}
					<StepReorderControls step={step} />

					{supportsAnalytics && isConfigured ? (
						<>
							{/* First Row: Icon, Content, Dropdown */}
							<div className="qcrm-reactflow-node__header-row">
								<div className="qcrm-reactflow-node__header-left">
									<div className="qcrm-reactflow-node__icon">
										<ActionIcon width={23} height={23} />
									</div>
									<div className="qcrm-reactflow-node__content">
										<div className="qcrm-reactflow-node__title">
											{__('Action', 'quillcrm')}
										</div>
										<div className="qcrm-reactflow-node__subtitle">
											<span className="qcrm-reactflow-action__configured">{actionName}</span>
										</div>
									</div>
								</div>
								<NodeActionsDropdown
									onEdit={handleEdit}
									onDelete={handleDelete}
									editLabel={__('Edit Action', 'quillcrm')}
									deleteLabel={__('Delete Action', 'quillcrm')}
									deleteTitle={__('Delete this action?', 'quillcrm')}
									deleteDescription={__(
										'This will remove the action from your workflow.',
										'quillcrm'
									)}
								/>
							</div>

							{/* Second Row: Recipient and View Analytics */}
							<div className="qcrm-reactflow-node__footer-row">
								<div className="qcrm-reactflow-node__recipient text-[#660FF1]">
									{getRecipientInfo()}
								</div>
								<button
									className="qcrm-reactflow-node__analytics-link text-primary"
									onClick={handleViewAnalytics}
									title={__('View Analytics', 'quillcrm')}
								>
									<ViewIcon width={16} height={16} />
									<span>{__('View Analytics', 'quillcrm')}</span>
								</button>
							</div>
						</>
					) : (
						<>
							<div className="qcrm-reactflow-node__icon">
								<ActionIcon width={23} height={23} />
							</div>
							<div className="qcrm-reactflow-node__content">
								<div className="qcrm-reactflow-node__title">
									{__('Action', 'quillcrm')}
								</div>
								<div className="qcrm-reactflow-node__subtitle">
									{subtitle}
								</div>
							</div>

							{/* Three dots dropdown menu */}
							<NodeActionsDropdown
								onEdit={handleEdit}
								onDelete={handleDelete}
								editLabel={__('Edit Action', 'quillcrm')}
								deleteLabel={__('Delete Action', 'quillcrm')}
								deleteTitle={__('Delete this action?', 'quillcrm')}
								deleteDescription={__(
									'This will remove the action from your workflow.',
									'quillcrm'
								)}
							/>
						</>
					)}

					<Handle
						type="source"
						position={Position.Bottom}
						className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
					/>
				</div>
			</NodeContextMenu>

			{/* Analytics Popup */}
			{isConfigured && supportsAnalytics && analyticsData && (
				<AnalyticsPopup
					visible={showAnalytics}
					onClose={() => setShowAnalytics(false)}
					actionType={getActionType()}
					analytics={{
						sent: analyticsData.sent,
						clickRate: analyticsData.clickRate,
						unsubscribed: analyticsData.unsubscribedRate,
						openRate: analyticsData.openRate,
						clickToOpenRate:
							analyticsData.openRate > 0
								? (analyticsData.clickRate /
										analyticsData.openRate) *
								  100
								: 0,
					}}
				/>
			)}
		</>
	);
};

export default ActionNode;
