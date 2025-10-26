/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Check, X } from 'lucide-react';

/**
 * Internal dependencies
 */

interface BranchNodeData {
	condition: 'yes' | 'no';
	conditionStep?: any;
}

const BranchNode: React.FC<NodeProps> = ({ data }) => {
	const { condition } = data as unknown as BranchNodeData;
	const isYes = condition === 'yes';

	return (
		<div
			className={`qcrm-reactflow-node qcrm-reactflow-node--branch qcrm-reactflow-node--branch-${condition}`}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
			/>

			<div className="qcrm-reactflow-branch__content">
				<div
					className={`qcrm-reactflow-branch__label qcrm-reactflow-branch__label--${condition}`}
				>
					{isYes ? <Check className="text-green-600 size-7" /> : <X className="text-destructive size-7" />}
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

export default BranchNode;
