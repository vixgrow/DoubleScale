import React from 'react';
import { useSelect } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailBlock } from '../../stores/email-builder/types';
import { blocksRegistry } from '../blocks/BlockRegister';
import { useBuilder } from '../context/BuilderContext';

interface BlockRendererProps {
	block: EmailBlock;
	sectionId: string;
	columnId: string;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({
	block,
	sectionId,
	columnId,
}) => {
	const { selectBlock, deleteBlock } = useBuilder();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: block.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const selectedBlockId = useSelect(
		(select) => select(STORE_KEY).getSelectedBlockId(),
		[]
	);

	const isSelected = selectedBlockId === block.id;
	const blockDefinition = blocksRegistry[block.type];

	const handleBlockClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		selectBlock(block.id, sectionId, columnId);
	};

	const handleDeleteBlock = (e: React.MouseEvent) => {
		e.stopPropagation();
		deleteBlock(block.id);
	};

	if (!blockDefinition) {
		return (
			<div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
				{__('Unknown block type:', 'quillcrm')} {block.type}
			</div>
		);
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={`
				relative mb-4 group cursor-pointer border-2 border-transparent 
				hover:border-blue-200 transition-colors rounded
				${isSelected ? 'border-blue-400' : ''}
			`}
			onClick={handleBlockClick}
		>
			{/* Block Controls */}
			{isSelected && (
				<div className="absolute -top-8 left-0 flex items-center gap-2 bg-white shadow-md rounded px-2 py-1 text-xs z-10">
					<div
						{...listeners}
						className="cursor-grab hover:cursor-grabbing flex items-center text-muted-foreground"
					>
						<GripVertical className="w-3 h-3" />
					</div>
					<span className="text-muted-foreground">
						{blockDefinition.name || block.type}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
						onClick={handleDeleteBlock}
					>
						<Trash2 className="w-3 h-3" />
					</Button>
				</div>
			)}

			{/* Block Content */}
			<div className="p-2">
				{blockDefinition.Renderer ? (
					<blockDefinition.Renderer props={block.props as any} />
				) : (
					<div className="text-muted-foreground">
						{__('No renderer available', 'quillcrm')}
					</div>
				)}
			</div>
		</div>
	);
};

export default BlockRenderer;
