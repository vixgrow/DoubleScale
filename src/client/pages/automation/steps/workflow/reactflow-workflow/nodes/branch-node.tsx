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

interface BranchNodeData {
	condition: 'yes' | 'no';
	conditionStep?: any;
}

const BranchNode: React.FC<NodeProps> = ({ data }) => {
	const { condition } = data as unknown as BranchNodeData;
	const isYes = condition === 'yes';

	// Tailwind classes for yes (green) and no (red/destructive)
	const colorClasses = isYes
		? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100 hover:border-green-600'
		: 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100 hover:border-red-600';

	return (
		<div
			className={`doublescale-reactflow-node doublescale-reactflow-node--branch doublescale-reactflow-node--branch-${condition} ${colorClasses}`}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="doublescale-reactflow-handle doublescale-reactflow-handle--target"
			/>

			<div className="doublescale-reactflow-branch__content">
				<div
					className={`doublescale-reactflow-branch__label doublescale-reactflow-branch__label--${condition}`}
				>
					{isYes ? __('Yes', 'doublescale') : __('No', 'doublescale')}
				</div>
			</div>

			<Handle
				type="source"
				position={Position.Bottom}
				className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
			/>
		</div>
	);
};

export default BranchNode;