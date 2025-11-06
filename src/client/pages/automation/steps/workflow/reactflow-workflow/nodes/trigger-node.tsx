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
import NodeLayout from '../components/node-layout';
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

	const subtitle = (
		<span style={{ fontWeight: 'bold', color: 'green' }}>
			{triggerName}
		</span>
	);

	return (
		<NodeContextMenu onEdit={viewMode ? undefined : handleEdit} showDelete={false} disabled={viewMode}>
			<div className={`qcrm-reactflow-node qcrm-reactflow-node--trigger ${isTriggerVisible ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}>
				<NodeLayout
					icon={<ActionIcon width={23} height={23} />}
					title={__('Start Workflow (Trigger)', 'quillcrm')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={() => { }}
					editLabel={__('Edit Trigger', 'quillcrm')}
					deleteLabel=""
					deleteTitle=""
					deleteDescription=""
					showDelete={false}
					viewMode={viewMode}
					analytics={analytics}
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
