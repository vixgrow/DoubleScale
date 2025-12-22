import React, { useEffect, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';

import {
	ReactFlow,
	Controls,
	Background,
	Node,
	Edge,
	EdgeProps,
	BaseEdge,
	EdgeLabelRenderer,
	applyNodeChanges,
	applyEdgeChanges,
	OnNodesChange,
	OnEdgesChange,
	NodeProps,
	Handle,
	Position,
	getStraightPath,
	MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SequenceMail } from '../../types';
import { EditIcon, PlusIcon } from '@quillcrm/components';
import FlagIcon from '@quillcrm/components/icons/flag';
import TrashIcon from '@quillcrm/components/icons/trash';
import SentSTimeIcon from '@quillcrm/components/icons/send-time';
import EmailSubjectIcon from '@quillcrm/components/icons/email-subject';

const NODE_WIDTH = 320;

// ==================== Types ====================
interface SequenceEmailNodeData {
	emailId: number;
	number: number;
	delay: string;
	name: string;
	subject: string;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onDuplicate: (id: number) => void;
	onShowReport: (id: number) => void;
	[key: string]: unknown;
}

// ==================== Custom Edge ====================
const CustomEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition = Position.Bottom,
	targetPosition = Position.Top,
	data,
}: EdgeProps) => {
	// For last edge, extend the line downward
	const isLast = data?.isLast;
	const finalTargetY = isLast ? sourceY + 100 : targetY;
	const finalTargetX = isLast ? sourceX : targetX;

	const [edgePath, labelX, labelY] = getStraightPath({
		sourceX,
		sourceY,
		targetX: finalTargetX,
		targetY: finalTargetY,
	});

	const onEdgeClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			if (typeof data?.onAddEmail === 'function') {
				data.onAddEmail();
			}
		},
		[data?.onAddEmail]
	);

	return (
		<>
			<BaseEdge
				path={edgePath}
				style={{
					stroke: '#D1D5DB',
					strokeWidth: 2,
				}}
			/>

			<EdgeLabelRenderer>
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: 'all',
					}}
					className="nodrag nopan"
				>
					<button
						onClick={onEdgeClick}
						className="w-8 h-8 bg-white border-2 border-[#458DC7] text-[#458DC7] hover:bg-[#1E3A8A] hover:text-[#FFF] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:shadow-[#1E3A8A] hover:scale-110 transition-all"
						title={__('Add email here', 'quillcrm')}
					>
						<PlusIcon />
					</button>
				</div>
			</EdgeLabelRenderer>
		</>
	);
};

// ==================== Custom Node for Email ====================
const SequenceEmailNode = ({ data, selected }: NodeProps) => {
	const nodeData = data as SequenceEmailNodeData;
	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<div
			className={`bg-white rounded-l-lg ${isHovered ? 'rounded-br-lg' : 'rounded-r-lg'} border-2 border-[#458DC7] py-[14px] px-4  flex flex-col gap-3 shadow-sm select-none relative group`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{ width: NODE_WIDTH }}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 opacity-0"
			/>

			<Handle
				type="source"
				position={Position.Bottom}
				className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 opacity-0"
			/>

			{/* Action Buttons - Show on hover or when selected */}
			{(isHovered || selected) && (
				<div className="absolute -right-9 top-8 -translate-y-1/2 flex flex-col gap-1.5 z-10 bg-[#FFF] border border-[#DEE1E6] p-2 rounded-br-lg rounded-tr-lg">
					<button
						onClick={(e) => {
							e.stopPropagation();
							nodeData.onEdit(nodeData.emailId);
						}}
						className="text-[#458DC7] border-b border-[#DEE1E6] pb-2"
						title={__('Edit', 'quillcrm')}
					>
						<EditIcon width={18} height={18} />
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							nodeData.onDelete(nodeData.emailId);
						}}
						className="text-red-500"
						title={__('Delete', 'quillcrm')}
					>
						<TrashIcon width={18} height={18} />
					</button>
				</div>
			)}

			{/* Header with Step number and Sending Time */}
			<div className="flex items-center justify-between py-2 px-3 mb-3 border border-[#DEE1E6] rounded-t-lg bg-[#F8F8F8]">
				<span className="text-sm font-semibold text-[#09090B]">
					{__(`Step ${nodeData.number}`, 'quillcrm')}
				</span>
				<div className="flex items-center gap-0.5 leading-[26px] text-[#777]">
					<SentSTimeIcon />
					<span className="text-sm">{nodeData.delay}</span>
				</div>
			</div>

			{/* Subject with icon */}
			<div className="flex items-center gap-2">
				<span className="p-2.5 border border-[#458DC7] rounded-[5px] bg-[#E3EEFF]">
					<EmailSubjectIcon width={24} height={24} />
				</span>
				<span className="leading-5 text-[#458DC7] truncate font-bold text-xl">
					{nodeData.subject || nodeData.name || 'Untitled Email'}
				</span>
			</div>
		</div>
	);
};

// ==================== Start Node ====================
const StartNode = () => {
	return (
		<div
			className="bg-white border border-[#DEE1E6] rounded-lg py-[14px] px-4 select-none"
			style={{ width: NODE_WIDTH }}
		>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 opacity-0"
			/>
			<div className="flex items-center gap-3">
				<span className="border border-[#DEE1E6] bg-[#F8F8F8] p-2.5 rounded-[5px]">
					<FlagIcon width={24} height={24} />
				</span>
				<span className="text-xl font-bold leading-[30px] text-[#09090B]">
					{__('Start (Email Sequence)', 'quillcrm')}
				</span>
			</div>
		</div>
	);
};

// ==================== Invisible End Node for empty state ====================
const InvisibleEndNode = () => {
	return (
		<div className="opacity-0 w-1 h-1">
			<Handle
				type="target"
				position={Position.Top}
				className="opacity-0"
			/>
		</div>
	);
};

const nodeTypes = {
	sequenceEmail: SequenceEmailNode,
	startNode: StartNode,
	invisibleEnd: InvisibleEndNode,
};

const edgeTypes = { custom: CustomEdge };

// ==================== Main Component ====================
interface EmailSequenceFlowChartProps {
	sequenceEmails: SequenceMail[];
	loading: boolean;
	onAddEmail: (afterEmailId?: number) => void;
	onEditEmail: (id: number) => void;
	onDeleteEmail: (id: number) => void;
	onDuplicateEmail: (id: number) => void;
	onShowReport: (id: number) => void;
}

const EmailSequenceFlowChart: React.FC<EmailSequenceFlowChartProps> = ({
	sequenceEmails,
	loading,
	onAddEmail,
	onEditEmail,
	onDeleteEmail,
	onDuplicateEmail,
	onShowReport,
}) => {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	const onNodesChange: OnNodesChange = (changes) =>
		setNodes((nds) => applyNodeChanges(changes, nds));

	const onEdgesChange: OnEdgesChange = (changes) =>
		setEdges((eds) => applyEdgeChanges(changes, eds));

	const formatDelay = (delay?: { value: number; unit: string }) => {
		if (!delay || delay.value === 0) return __('Sending Time', 'quillcrm');
		const unit = delay.unit.toLowerCase();
		const single = delay.value === 1 ? unit.slice(0, -1) : unit;
		return `${delay.value} ${single}`;
	};

	useEffect(() => {
		if (loading || !sequenceEmails) {
			setNodes([]);
			setEdges([]);
			return;
		}

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];
		const VERTICAL_SPACING = 300;
		const HORIZONTAL_POS = 0;

		// Add Start Node
		newNodes.push({
			id: 'start',
			type: 'startNode',
			position: { x: HORIZONTAL_POS, y: 0 },
			data: {},
			draggable: false,
			selectable: false,
		});

		if (sequenceEmails.length === 0) {
			// Add invisible end node for proper edge rendering
			newNodes.push({
				id: 'invisible-end',
				type: 'invisibleEnd',
				position: { x: NODE_WIDTH / 2, y: 200 },
				data: {},
				draggable: false,
				selectable: false,
			});

			newEdges.push({
				id: 'edge-start-end',
				source: 'start',
				target: 'invisible-end',
				type: 'custom',
				data: {
					onAddEmail: () => onAddEmail(),
					isLast: false,
				},
			});
		} else {
			// Add email nodes
			sequenceEmails.forEach((email, index) => {
				const nodeId = `email-${email.id}`;
				const nodeY = (index + 1) * VERTICAL_SPACING;

				newNodes.push({
					id: nodeId,
					type: 'sequenceEmail',
					position: { x: HORIZONTAL_POS, y: nodeY },
					data: {
						emailId: email.id,
						number: index + 1,
						delay: formatDelay(email.settings?.delay),
						name: email.name || 'Untitled Email',
						subject: email.name || 'Subject Name',
						onEdit: onEditEmail,
						onDelete: onDeleteEmail,
						onDuplicate: onDuplicateEmail,
						onShowReport,
					} as SequenceEmailNodeData,
					draggable: false,
					selectable: true,
				});

				// Add edge from previous node
				if (index === 0) {
					newEdges.push({
						id: `edge-start-${email.id}`,
						source: 'start',
						target: nodeId,
						type: 'custom',
						data: {
							onAddEmail: () => onAddEmail(),
						},
					});
				} else {
					const prevEmail = sequenceEmails[index - 1];
					newEdges.push({
						id: `edge-${prevEmail.id}-${email.id}`,
						source: `email-${prevEmail.id}`,
						target: nodeId,
						type: 'custom',
						data: {
							onAddEmail: () => onAddEmail(prevEmail.id),
						},
					});
				}
			});

			// Add End Edge with + button only (no end node)
			const lastEmail = sequenceEmails[sequenceEmails.length - 1];

			newEdges.push({
				id: `edge-${lastEmail.id}-end`,
				source: `email-${lastEmail.id}`,
				target: `email-${lastEmail.id}`,
				type: 'custom',
				data: {
					onAddEmail: () => onAddEmail(lastEmail.id),
					isLast: true,
				},
			});
		}

		setNodes(newNodes);
		setEdges(newEdges);
	}, [
		sequenceEmails,
		loading,
		onAddEmail,
		onEditEmail,
		onDeleteEmail,
		onDuplicateEmail,
		onShowReport,
	]);

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center bg-[#F6F8FA]">
				<p className="text-xl text-gray-600">
					{__('Loading sequence...', 'quillcrm')}
				</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full relative !mx-0 !overflow-hidden">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				minZoom={0.5}
				maxZoom={1.5}
				defaultViewport={{ x: 0, y: 0, zoom: 1 }}
				nodesDraggable={false}
				panOnDrag={true}
				zoomOnScroll={true}
				zoomOnDoubleClick={false}
				selectionOnDrag={false}
				proOptions={{ hideAttribution: true }}
			>
				<Background />
				<MiniMap
					nodeStrokeWidth={3}
					nodeColor="#e2e2e2"
					nodeStrokeColor="transparent"
					maskColor="rgba(240, 240, 240, 0.8)"
					style={{
						border: '1px solid #e8e8e8',
						borderRadius: '4px',
					}}
					zoomable
					pannable
					position="bottom-right"
				/>
				<Controls className="bg-white shadow-lg rounded-lg border border-gray-200 !absolute !left-4 !bottom-4" />
			</ReactFlow>
		</div>
	);
};

export default EmailSequenceFlowChart;
