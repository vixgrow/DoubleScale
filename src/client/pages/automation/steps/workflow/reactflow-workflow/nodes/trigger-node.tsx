/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';

/**
 * Internal dependencies
 */
import type { Automation } from '@quillcrm/client';
import { getTrigger } from '@quillcrm/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import { ActionIcon } from '@quillcrm/components';

interface TriggerNodeData {
	automation: Automation;
	isTriggerVisible?: boolean;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onTriggerClick?: () => void;
	onDeleteTrigger?: (triggerId: string) => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const { automation, onTriggerClick, isTriggerVisible, viewMode = false, analytics } = data as unknown as TriggerNodeData;

	const handleEdit = () => {
		if (!viewMode && onTriggerClick) {
			onTriggerClick();
		}
	};

	// Get trigger label from the automation trigger
	const triggerData = getTrigger(automation?.trigger || '');
	const triggerName =
		triggerData?.label ||
		automation?.trigger ||
		__('No trigger selected', 'quillcrm');

	return (
		<NodeContextMenu onEdit={viewMode ? undefined : handleEdit} showDelete={false} disabled={viewMode}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--trigger ${isTriggerVisible ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}>
				{viewMode && analytics ? (
					<>
						{/* Header Row: Icon, Content, Dropdown */}
						<div className="qcrm-reactflow-node__header-row">
							<div className="qcrm-reactflow-node__header-left">
								<div className="qcrm-reactflow-node__icon">
									<ActionIcon width={23} height={23} />
								</div>
								<div className="qcrm-reactflow-node__content">
									<div className="qcrm-reactflow-node__title">
										{__('Start Workflow (Trigger)', 'quillcrm')}
									</div>
									<div className="qcrm-reactflow-node__trigger-name">
										<span style={{ fontWeight: 'bold', color: 'green' }}>
											{triggerName}
										</span>
									</div>
								</div>
							</div>
							<NodeActionsDropdown
								onEdit={handleEdit}
								editLabel={__('Edit Trigger', 'quillcrm')}
								showDelete={false}
							/>
						</div>

						{/* Footer Row: Analytics */}
						<div className="qcrm-reactflow-node__footer-row">
							<div className="text-sm">
								<span className="text-[#667085]">{__('Contact:', 'quillcrm')} </span>
								<span className="font-semibold text-[#344054]">{analytics.contacts || 0}</span>
							</div>
							<div className="text-sm">
								<span className="text-[#667085]">{__('Conversion Rate:', 'quillcrm')} </span>
								<span className="font-semibold text-[#344054]">{analytics.conversion_rate || 0}%</span>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="qcrm-reactflow-node__icon">
							<ActionIcon width={23} height={23} />
						</div>
						<div className="qcrm-reactflow-node__content">
							<div className="qcrm-reactflow-node__title">
								{__('Start Workflow (Trigger)', 'quillcrm')}
							</div>
							<div className="qcrm-reactflow-node__trigger-name">
								<span style={{ fontWeight: 'bold', color: 'green' }}>
									{triggerName}
								</span>
							</div>
						</div>

						{/* Three dots dropdown menu */}
						<NodeActionsDropdown
							onEdit={handleEdit}
							editLabel={__('Edit Trigger', 'quillcrm')}
							showDelete={false}
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
	);
};

export default TriggerNode;
