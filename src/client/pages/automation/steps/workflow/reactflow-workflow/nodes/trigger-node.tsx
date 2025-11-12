/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { Automation } from '@quillcrm/client';
import { getTriggerLabel, hasTriggerWarning } from '@quillcrm/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import { ActionIcon } from '@quillcrm/components';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface TriggerNodeData {
	automation: Automation;
	isTriggerVisible?: boolean;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onTriggerClick?: () => void;
	onDeleteTrigger?: (triggerId: string) => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const {
		automation,
		onTriggerClick,
		isTriggerVisible,
		viewMode = false,
		analytics,
	} = data as unknown as TriggerNodeData;

	const handleEdit = () => {
		if (!viewMode && onTriggerClick) {
			onTriggerClick();
		}
	};

	// Get trigger label and warning status from backend
	const triggerName = getTriggerLabel(automation);
	const hasWarning = hasTriggerWarning(automation);

	const subtitle = (
		<div className="flex items-center gap-2">
			<span
				style={{
					fontWeight: 'bold',
					color: hasWarning ? '#f59e0b' : 'green',
				}}
			>
				{triggerName}
			</span>
			{hasWarning && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangle className="h-4 w-4 text-orange-500" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="font-semibold">
								{__('Plugin Required', 'quillcrm')}
							</p>
							<p className="text-xs mt-1">
								{__(
									'This trigger requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
									'quillcrm'
								)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);

	return (
		<NodeContextMenu
			onEdit={viewMode ? undefined : handleEdit}
			showDelete={false}
			disabled={viewMode}
		>
			<div
				className={`qcrm-reactflow-node qcrm-reactflow-node--trigger ${isTriggerVisible ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`}
			>
				<NodeLayout
					icon={<ActionIcon width={23} height={23} />}
					title={__('Start Workflow (Trigger)', 'quillcrm')}
					subtitle={subtitle}
					onEdit={handleEdit}
					onDelete={() => {}}
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
