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

interface TriggerNodeData {
	automation: Automation;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const { automation } = data as unknown as TriggerNodeData;
	const trigger = automation ? getTrigger(automation.trigger) : null;

	return (
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
	);
};

export default TriggerNode;
