import React, { useCallback } from 'react';
import { useSelect } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailBlock } from '../../stores/email-builder/types';
import { useRegisteredBlocks } from '@/stores/blocks-registry';
import { getBlockDefinition } from '../blocks/blockRegistryUtils';
import { DeleteIcon, MoveBlockIcon } from '@doublescale/components';
import { useDispatch } from '@wordpress/data';
import { isTemplateBlock } from '@doublescale/utils/templateUtils';
import { ImageResizeHandles } from './ImageResizeHandles';

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
	const dispatch = useDispatch();
	const blocksRegistry = useRegisteredBlocks();

	// Check if this block is part of a template (locked from editing)
	const isThisTemplateBlock = isTemplateBlock(block);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: block.id,
		data: {
			type: 'block',
			blockId: block.id,
			sectionId: sectionId,
			columnId: columnId,
			block: block,
		},
		disabled: isThisTemplateBlock, // Disable dragging for template blocks
	});

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

	// Get block definition with fallback to UnknownBlock
	const {
		block: blockDefinition,
		isUnknown,
		info,
	} = getBlockDefinition(block.type, blocksRegistry, blocksRegistry.unknown);

	const handleBlockClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).selectBlock(block.id, sectionId, columnId);
	};

	const handleDeleteBlock = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).deleteBlock(block.id);
	};

	const handleImageResize = useCallback(
		(width: string, height: string) => {
			dispatch(STORE_KEY).updateBlock(block.id, { width, height });
		},
		[block.id, dispatch]
	);

	// Prepare props for rendering
	// If unknown, pass original type and props for preservation
	const renderProps =
		isUnknown && info
			? {
					originalType: info.originalType,
					originalProps: block.props,
				}
			: block.props;

	// Check if this is an image block and should show resize handles
	const isImageBlock =
		block.type === 'image' && isSelected && !isThisTemplateBlock;
	const imageProps = isImageBlock ? (renderProps as any) : null;

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			data-block-id={block.id}
			data-block-type={block.type}
			className={`
				relative mb-4 group cursor-pointer border
				hover:border-primary transition-colors
				${isSelected ? 'border-primary' : 'border-transparent'}
			`}
			onClick={handleBlockClick}
		>
			{/* Block Controls */}
			{isSelected && (
				<div className="absolute -top-[34px] -left-[1.5px] flex items-center gap-2 bg-white shadow-md rounded-t-xl px-2 py-1 text-sm z-10"
				style={{boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.14)'}}
				>
					{/* Only show drag handle for non-template blocks */}
					{!isThisTemplateBlock && (
						<div
							{...listeners}
							className="cursor-grab hover:cursor-grabbing flex items-center text-secondary-foreground border-r border-border pr-2"
						>
							<MoveBlockIcon width={16} height={16} />
						</div>
					)}
					<span className="text-primary border-r border-border pr-2">
						{blockDefinition.name || block.type}
					</span>
					{/* Only show delete button for non-template blocks */}
					{!isThisTemplateBlock && (
						<span
							className="text-destructive cursor-pointer"
							onClick={handleDeleteBlock}
						>
							<DeleteIcon />
						</span>
					)}
				</div>
			)}

			{/* Block Content */}
			<div className="p-2 relative">
				{blockDefinition.Renderer ? (
					<blockDefinition.Renderer
						props={
							isImageBlock && imageProps
								? {
										...renderProps,
										renderResizeHandles: (
											containerRef: React.RefObject<HTMLDivElement>
										) =>
											isImageBlock && imageProps ? (
												<ImageResizeHandles
													width={
														imageProps.width ||
														'100%'
													}
													height={
														imageProps.height ||
														'auto'
													}
													onResize={handleImageResize}
													containerRef={containerRef}
												/>
											) : null,
									}
								: (renderProps as any)
						}
					/>
				) : (
					<div className="text-muted-foreground">
						{__('No renderer available', 'doublescale')}
					</div>
				)}
			</div>
		</div>
	);
};

export default BlockRenderer;
