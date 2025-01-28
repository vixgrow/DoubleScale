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

const TemplateBuilder = () => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [targetIndex, setTargetIndex] = useState<number | null>(null);
	const [activeDragData, setActiveDragData] = useState<any>(null);

	// Selectors for blocks and block types
	const { blockTypes, formBlocks } = useSelect((select) => ({
		blockTypes: select('quillcrm/email-editor-blocks').getBlockTypes(),
		formBlocks: select('quillcrm/email-editor').getBlocks(),
	}));

	// Dispatch actions for inserting and reordering blocks
	const { __experimentalReorderBlocks, __experimentalInsertBlock } = useDispatch(
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

	/**
	 * Handle the end of a drag event
	 */
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		console.log("Dragging ended. Active:", active, "Over:", over);

		if (!over) {
			console.log("No valid drop target.");
			setActiveId(null);
			setActiveDragData(null);
			setTargetIndex(null);
			return;
		}


		const cleanup = () => {
			setActiveId(null);
			setActiveDragData(null);
			setTargetIndex(null);
		};

		// If dropped outside valid drop zones, do nothing
		if (!over || (over.id !== 'DROP_AREA' && !formBlocks.some((block) => block.id === over.id))) {
			cleanup();
			return;
		}

		// Handle new block insertion
		if (activeDragData?.type === 'PANEL_BLOCK') {
			if (over.id === 'DROP_AREA' || formBlocks.some((block) => block.id === over.id)) {
				const blockName = activeDragData.name;
				const newBlock = {
					id: generateId(),
					name: blockName,
					attributes: sanitizeBlockAttributes(blockName, {}),
				};
				const insertIndex = targetIndex === null ? formBlocks.length : targetIndex;
				__experimentalInsertBlock(newBlock, insertIndex);
			}
		}
		// Handle existing block reordering
		else if (activeDragData?.type === 'EXISTING_BLOCK') {
			const oldIndex = formBlocks.findIndex((block) => block.id === active.id);
			if (oldIndex !== -1 && targetIndex !== null && oldIndex !== targetIndex) {
				__experimentalReorderBlocks(oldIndex, targetIndex);
			}
		}

		cleanup();
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