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
	onTriggerClick?: () => void;
	onDeleteTrigger?: (triggerId: string) => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const { automation, onTriggerClick, isTriggerVisible } = data as unknown as TriggerNodeData;

	const handleEdit = () => {
		if (onTriggerClick) {
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
		<NodeContextMenu onEdit={handleEdit} showDelete={false}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--trigger ${isTriggerVisible ? 'qcrm-reactflow-node--selected' : ''}`}>
				<div className="qcrm-reactflow-node__icon">
					<ActionIcon width={23} height={23} />
				</div>
				<div
					className="qcrm-reactflow-node__content"
					style={{ flex: 1, marginRight: '60px' }}
				>
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
