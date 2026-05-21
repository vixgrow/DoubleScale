import React, { useCallback, useEffect, useState } from 'react';
import { useSelect } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailBlock } from '../../stores/email-builder/types';
import { useRegisteredBlocks } from '@/stores/blocks-registry';
import { getBlockDefinition } from '../blocks/blockRegistryUtils';
import { DeleteIcon, MoveBlockIcon } from '@doublescale/components';
import {
	Popover,
	PopoverAnchor,
} from '@/components/ui/popover';
import {
	TextBlockAiPopoverPanel,
	TextBlockAiTrigger,
} from './TextBlockAiPopover';
import { useDispatch } from '@wordpress/data';
import { isTemplateBlock } from '@doublescale/utils/templateUtils';
import { ImageResizeHandles } from './ImageResizeHandles';
import ConfigApi from '@doublescale/config';

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

	const isTextBlock = block.type === 'text';
	const isTextAiChrome = isTextBlock && !isThisTemplateBlock && ConfigApi.isAiConfigured();
	const [aiPopoverOpen, setAiPopoverOpen] = useState(false);

	useEffect(() => {
		if (!isSelected) {
			setAiPopoverOpen(false);
		}
	}, [isSelected]);

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

	const toolbar =
		isSelected && (
			<div
				className="absolute -top-[34px] -left-[1.5px] z-20 flex items-center gap-2 rounded-t-xl bg-white px-2 py-1 text-sm shadow-md"
				style={{ boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.14)' }}
			>
				{!isThisTemplateBlock && (
					<div
						{...listeners}
						className="flex cursor-grab items-center border-r border-border pr-2 text-secondary-foreground hover:cursor-grabbing"
					>
						<MoveBlockIcon width={16} height={16} />
					</div>
				)}
				{isTextAiChrome && <TextBlockAiTrigger />}
				<span className="border-r border-border pr-2 text-primary">
					{blockDefinition.name || block.type}
				</span>
				{!isThisTemplateBlock && (
					<span
						className="cursor-pointer text-destructive"
						onClick={handleDeleteBlock}
					>
						<DeleteIcon width={16} height={16}/>
					</span>
				)}
			</div>
		);

	const canvasInner = blockDefinition.Renderer ? (
		block.type === 'text' ? (
			<blockDefinition.Renderer
				props={renderProps as any}
				canvasEditable={isSelected && !isThisTemplateBlock}
				onCanvasContentChange={(content: string) =>
					dispatch(STORE_KEY).updateBlock(block.id, {
						content,
					})
				}
			/>
		) : (
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
										width={imageProps.width || '100%'}
										height={imageProps.height || 'auto'}
										onResize={handleImageResize}
										containerRef={containerRef}
									/>
								) : null,
						}
						: (renderProps as any)
				}
			/>
		)
	) : (
		<div className="text-muted-foreground">
			{__('No renderer available', 'doublescale')}
		</div>
	);

	const canvasWrap = (
		<div data-block-canvas-content className="relative p-2">
			{canvasInner}
		</div>
	);

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
			{isTextAiChrome ? (
				<Popover
					open={aiPopoverOpen}
					onOpenChange={setAiPopoverOpen}
					modal={false}
				>
					<PopoverAnchor asChild>
						<div
							aria-hidden
							className="pointer-events-none absolute bottom-0 left-0 right-0 h-0 w-full"
						/>
					</PopoverAnchor>
					{toolbar}
					{canvasWrap}
					<TextBlockAiPopoverPanel
						onApplyContent={(content) =>
							dispatch(STORE_KEY).updateBlock(block.id, {
								content,
							})
						}
						onClose={() => setAiPopoverOpen(false)}
					/>
				</Popover>
			) : (
				<>
					{toolbar}
					{canvasWrap}
				</>
			)}
		</div>
	);
};

export default BlockRenderer;
