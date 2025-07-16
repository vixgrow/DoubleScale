/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { RocketOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { getTrigger } from '@quillcrm/utils';
import type { Automation } from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';

interface TriggerNodeData {
	automation: Automation;
	onTriggerClick?: () => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const { automation, onTriggerClick } = data as unknown as TriggerNodeData;
	const trigger = automation ? getTrigger(automation.trigger) : null;

	const handleEdit = () => {
		if (onTriggerClick) {
			onTriggerClick();
		}
	};

	return (
		<NodeContextMenu onEdit={handleEdit} showDelete={false}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--trigger">
				<div className="qcrm-reactflow-node__icon">
					<RocketOutlined />
				</div>
				<div className="qcrm-reactflow-node__content">
					<div className="qcrm-reactflow-node__title">
						{trigger?.label || __('Trigger', 'quillcrm')}
					</div>
					<div className="qcrm-reactflow-node__subtitle">
						{__('Start', 'quillcrm')}
					</div>
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

export default TriggerNode;
