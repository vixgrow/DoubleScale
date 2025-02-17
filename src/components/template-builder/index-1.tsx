import {
	DndContext,
	DragOverlay,
	useSensor,
	useSensors,
	MouseSensor,
	TouchSensor,
	DragStartEvent,
	DragEndEvent,
	DragOverEvent,
	closestCenter,
	rectIntersection
} from '@dnd-kit/core';
import { createPortal } from '@wordpress/element';
import { useState } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { sanitizeBlockAttributes } from '../../api/email-editor-blocks';
import BlocksPanel from './blocks-panel';
import DropArea from './drop-area';
import './style.scss';
import type { BlockTypeSettings } from '../../stores/email-editor-blocks/types';
import type { FormBlock } from '@quillforms/types';

const TemplateBuilder = () => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [targetIndex, setTargetIndex] = useState<number | null>(null);
	type ActiveDragData =
		| { type: 'PANEL_BLOCK'; name: string; blockType: BlockTypeSettings }
		| { type: 'EXISTING_BLOCK'; block: FormBlock; blockType: BlockTypeSettings; parentId?: string; columnIndex?: number };

	const [activeDragData, setActiveDragData] = useState<ActiveDragData | null>(null);

	const [targetLayout, setTargetLayout] = useState<{ layoutBlockId: string; columnIndex: number } | null>(null);


	// Selectors for blocks and block types
	const { blockTypes, formBlocks } = useSelect((select) => ({
		blockTypes: select('quillcrm/email-editor-blocks').getBlockTypes(),
		formBlocks: select('quillcrm/email-editor').getBlocks(),
	}));

	// Dispatch actions for inserting and reordering blocks
	const { __experimentalReorderBlocks, __experimentalInsertBlock, setBlockAttributes } = useDispatch(
		'quillcrm/email-editor'
	);

	// Drag-and-drop sensors
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
	);

	/**
	 * Handle the start of a drag event
	 */
	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		setActiveId(active.id);

		const activeData = active.data.current;
		if (activeData?.type === 'PANEL_BLOCK') {
			setActiveDragData({
				type: 'PANEL_BLOCK',
				name: active.id,
				blockType: blockTypes[active.id],
			});
		} else if (activeData?.type === 'EXISTING_BLOCK') {
			const block = formBlocks.find((b) => b.id === active.id);
			if (block) {
				setActiveDragData({
					type: 'EXISTING_BLOCK',
					block,
					blockType: blockTypes[block.name],
				});
			}
		}
	};

	/**
	 * Handle dragging over a valid drop zone or block
	 */
	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;

		// If no valid drop target, reset targetIndex
		if (!over || (over.id !== 'DROP_AREA' && !formBlocks.some((block) => block.id === over.id))) {
			setTargetIndex(null);
			return;
		}

		// If over the DROP_AREA, set targetIndex to the end of the blocks
		if (over.id === 'DROP_AREA') {
			setTargetIndex(formBlocks.length);
			return;
		}

		// Determine the index of the block being dragged over
		const overIndex = formBlocks.findIndex((block) => block.id === over.id);
		if (overIndex === -1) {
			setTargetIndex(null);
			return;
		}

		// Check if the dragged item is below or above the current block
		const isBelowOverItem =
			active.rect.current.translated &&
			active.rect.current.translated.top > over.rect.top + over.rect.height / 2;

		const modifier = isBelowOverItem ? 1 : 0;
		setTargetIndex(overIndex + modifier);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		console.log('Dragging ended. Active:', active, 'Over:', over);
		const cleanup = () => {
			setActiveId(null);
			setActiveDragData(null);
			setTargetIndex(null);
			setTargetLayout(null);
		};
		if (!over) {
			console.log('No valid drop target.');
			cleanup();
			return;
		}



		try {
			if (!activeDragData) {
				console.error('No active drag data.');
				return;
			}

			// Handle dropping into a layout column
			if (over.data.current?.type === 'LAYOUT_COLUMN') {
				handleDropIntoLayoutColumn(active, over, activeDragData);
			}
			// Handle dropping into the global drop area
			else if (over.id === 'DROP_AREA') {
				handleDropIntoGlobalArea(active, over, activeDragData);
			}
		} catch (error) {
			console.error('Error during drag end:', error);
		} finally {
			cleanup();
		}
	};

	const handleDropIntoLayoutColumn = (
		active: { id: string },
		over: { data: { current: { layoutBlockId: string; columnIndex: number } } },
		activeDragData: ActiveDragData
	) => {
		const layoutBlockId = over.data.current.layoutBlockId;

		const layoutBlock = formBlocks.find((block) => block.id === layoutBlockId);
		if (!layoutBlock) {
			console.error('Layout block not found.');
			return;
		}

		if (activeDragData.type === 'PANEL_BLOCK') {
			insertNewBlockIntoLayout(layoutBlock, activeDragData);
		} else if (activeDragData.type === 'EXISTING_BLOCK') {
			moveOrReorderExistingBlockInLayout(layoutBlock, active, activeDragData);
		}
	};

	const insertNewBlockIntoLayout = (
		layoutBlock: FormBlock,
		activeDragData: { type: 'PANEL_BLOCK'; name: string }
	) => {
		const blockName = activeDragData.name;
		const newBlock = {
			id: generateId(),
			name: blockName,
			attributes: sanitizeBlockAttributes(blockName, {}),
		};

		const updatedInnerBlocks = [...(layoutBlock.innerBlocks || [])];
		updatedInnerBlocks.push(newBlock);

		setBlockAttributes(layoutBlock.id, {
			innerBlocks: updatedInnerBlocks,
		});
	};

	const moveOrReorderExistingBlockInLayout = (
		layoutBlock: FormBlock,
		active: { id: string },
		activeDragData: { type: 'EXISTING_BLOCK'; parentId?: string }
	) => {
		if (targetIndex === null) {
			console.error('Target index is null.');
			return;
		}

		// Remove the block from its original parent
		if (activeDragData.parentId) {
			const sourceParent = formBlocks.find((block) => block.id === activeDragData.parentId);
			if (!sourceParent || !sourceParent.innerBlocks) {
				console.error('Source parent not found.');
				return;
			}

			const sourceInnerBlocks = [...sourceParent.innerBlocks];
			const movingBlockIndex = sourceInnerBlocks.findIndex((block) => block.id === active.id);

			if (movingBlockIndex !== -1) {
				const [movingBlock] = sourceInnerBlocks.splice(movingBlockIndex, 1);

				// Update the source innerBlocks
				setBlockAttributes(sourceParent.id, {
					innerBlocks: sourceInnerBlocks,
				});

				// Add the block to the target layout
				const targetInnerBlocks = [...(layoutBlock.innerBlocks || [])];
				targetInnerBlocks.splice(targetIndex, 0, movingBlock);

				setBlockAttributes(layoutBlock.id, {
					innerBlocks: targetInnerBlocks,
				});
			}
		}
	};

	const handleDropIntoGlobalArea = (
		active: { id: string },
		over: { id: string },
		activeDragData: ActiveDragData
	) => {
		if (activeDragData.type === 'PANEL_BLOCK') {
			insertNewBlockIntoGlobalArea(activeDragData);
		} else if (activeDragData.type === 'EXISTING_BLOCK') {
			reorderExistingBlockInGlobalArea(active);
		}
	};

	const insertNewBlockIntoGlobalArea = (activeDragData: { type: 'PANEL_BLOCK'; name: string }) => {
		const blockName = activeDragData.name;
		const newBlock = {
			id: generateId(),
			name: blockName,
			attributes: sanitizeBlockAttributes(blockName, {}),
		};

		const insertIndex = targetIndex === null ? formBlocks.length : targetIndex;
		__experimentalInsertBlock(newBlock, insertIndex);
	};

	const reorderExistingBlockInGlobalArea = (active: { id: string }) => {
		if (targetIndex === null) {
			console.error('Target index is null.');
			return;
		}

		const oldIndex = formBlocks.findIndex((block) => block.id === active.id);

		if (oldIndex !== -1 && oldIndex !== targetIndex) {
			__experimentalReorderBlocks(oldIndex, targetIndex);
		}
	};

	/**
	 * Generate a unique ID for a new block
	 */
	const generateId = () => Math.random().toString(36).substr(2, 9);

	return createPortal(
		<div className="qcrm-template-builder-wrapper">
			<div className="qcrm-template-builder">
				<DndContext
					sensors={sensors}
					collisionDetection={(args) => {
						// Use rectIntersection to detect valid drop zones
						return rectIntersection(args);
					}}

					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
				>
					<BlocksPanel />
					<DropArea items={formBlocks} targetIndex={targetIndex} isDragging={!!activeId} />
					<DragOverlay>
						{activeDragData && (
							<div className="dragging-block-overlay">
								{activeDragData.type === 'PANEL_BLOCK' ? (
									<div className="qcrm-email-editor-blocks-list__item">
										<div className="qcrm-email-editor-blocks-list__item-icon">
											{activeDragData.blockType?.icon}
										</div>
										<div className="qcrm-email-editor-blocks-list__item-title">
											{activeDragData.blockType?.title}
										</div>
									</div>
								) : (
									<div className="sortable-block">
										<div className="sortable-block__content">
											<activeDragData.blockType.edit
												id={activeDragData.block.id}
												attributes={activeDragData.block.attributes}
											/>
										</div>
									</div>
								)}
							</div>
						)}
					</DragOverlay>
				</DndContext>
			</div>
		</div>,
		document.body
	);
};

export default TemplateBuilder;