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

interface TriggerNodeData {
	automation: Automation;
	onTriggerClick?: () => void;
	onDeleteTrigger?: (triggerId: string) => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const { automation, onTriggerClick } = data as unknown as TriggerNodeData;

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

	const TriggerIcon = () => (
		<svg
			width="16"
			height="23"
			viewBox="0 0 16 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8.89682 1.92518L1.9282 11.3173C1.87461 11.3896 1.85434 11.5105 1.89889 11.6274C1.91078 11.6586 1.92368 11.6789 1.93287 11.6908H5.30393C6.41744 11.6908 7.07754 12.7056 7.07754 13.6316V20.9321C7.07754 20.9991 7.08993 21.0452 7.10266 21.0749L14.0713 11.6827C14.1249 11.6105 14.1451 11.4896 14.1006 11.3727C14.0887 11.3415 14.0758 11.3212 14.0666 11.3093H10.6955C9.58204 11.3093 8.92194 10.2945 8.92194 9.36848V2.06796C8.92194 2.00103 8.90955 1.95491 8.89682 1.92518ZM9.57303 0.272146C10.2403 0.570786 10.6719 1.26287 10.6719 2.06796V9.36848C10.6719 9.46601 10.7056 9.53025 10.7291 9.55807C10.7294 9.55848 10.7298 9.55888 10.7301 9.55926H14.0994C14.9483 9.55926 15.5101 10.1571 15.7358 10.7494C15.963 11.3453 15.9339 12.1093 15.4767 12.7255L8.47843 22.1576C7.96043 22.8557 7.12638 23.0412 6.42645 22.7279C5.75917 22.4293 5.32754 21.7372 5.32754 20.9321V13.6316C5.32754 13.5341 5.29385 13.4698 5.27039 13.442C5.27004 13.4416 5.26971 13.4412 5.26938 13.4408H1.90009C1.05117 13.4408 0.489405 12.843 0.26365 12.2507C0.0365179 11.6548 0.0655637 10.8908 0.522799 10.2746L7.52105 0.842495C8.03905 0.144339 8.87309 -0.0411119 9.57303 0.272146Z"
				fill="currentColor"
			/>
		</svg>
	);

	return (
		<NodeContextMenu onEdit={handleEdit} showDelete={false}>
			<div className="qcrm-reactflow-node qcrm-reactflow-node--trigger">
				<div className="qcrm-reactflow-node__icon">
					<TriggerIcon />
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
					<div className="qcrm-reactflow-node__subtitle">
						{__(
							'Select the event that starts your Workflow',
							'quillcrm'
						)}
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
