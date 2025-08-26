/**
 * external dependencies
 */
import React, { useState } from 'react';
import {
	DndContext,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
	DragStartEvent,
	DragEndEvent,
	pointerWithin,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
/**
 * internal dependencies
 */
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BlockEditor from './components/BlockEditor';
import TemplateCard from './components/TemplateCard';
import { BuilderProvider, useBuilder } from './context/BuilderContext';

const BuilderContent: React.FC = () => {
	const { addNewSection, addNewBlock, reorderSections, moveBlock } =
		useBuilder();
	const sensors = useSensors(useSensor(PointerSensor));
	const [activeItem, setActiveItem] = useState<any>(null);

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;

		// Check if this is a section being sorted (from useSortable)
		if (active.data?.current?.type === 'section') {
			// This is a section being sorted - don't set activeItem
			setActiveItem(null);
			return;
		}

		// Check if this is a block being sorted (from useSortable)
		if (active.data?.current?.type === 'block') {
			// This is a block being sorted - don't set activeItem for drag overlay
			setActiveItem(null);
			return;
		}

		// This is a template card being dragged from sidebar (from useDraggable)
		setActiveItem(active.data.current);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveItem(null);

		if (!over || active.id === over.id) return;

		console.log('active', active);
		console.log('over', over);

		// Handle section reordering (when dragging sections to reorder them)
		if (
			active.data?.current?.type === 'section' &&
			over.data?.current?.type === 'section'
		) {
			// This is section reordering
			const activeSectionId = active.data.current.sectionId;
			const overSectionId = over.data.current.sectionId;
			reorderSections(activeSectionId, overSectionId);
			return;
		}

		// Handle block reordering (when dragging blocks between columns)
		if (active.data?.current?.type === 'block') {
			const activeData = active.data.current;
			const overData = over.data?.current;

			// Moving block to a different column
			if (overData?.type === 'column') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				// Only move if it's actually moving to a different column
				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId
				) {
					moveBlock(
						blockId,
						fromSectionId,
						fromColumnId,
						toSectionId,
						toColumnId,
						0
					);
				}
				return;
			}

			// Moving block within the same column or to a different position
			if (overData?.type === 'block') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				// For block-to-block drops, we'll put the block right after the target block
				const toIndex = 1; // Put after the target block

				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId ||
					active.id !== over.id
				) {
					moveBlock(
						blockId,
						fromSectionId,
						fromColumnId,
						toSectionId,
						toColumnId,
						toIndex
					);
				}
				return;
			}
		}

		// Handle dropping new blocks from sidebar
		if (active.data?.current?.type === 'element') {
			const { blockType } = active.data.current;
			const overData = over.data?.current;

			if (overData?.type === 'column') {
				const { sectionId, columnId } = overData;
				addNewBlock(sectionId, columnId, blockType);
				return;
			}
		}

		// Handle dropping new sections
		if (active.data?.current?.type === 'layout') {
			addNewSection(active.data.current.item);
		}

		console.log('Drag ended:', { active: active.id, over: over.id });
	};

	return (
		<div className="flex flex-col absolute top-0 left-0 right-0 bottom-0 z-50 bg-primary-foreground">
			<Header />
			<div
				className="flex flex-1 pt-1"
				style={{ backgroundColor: '#e6eff7' }}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={pointerWithin}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[snapCenterToCursor]}
				>
					<Sidebar />
					<Canvas />
					<DragOverlay>
						{activeItem && activeItem.item ? (
							<div className="opacity-90 transform rotate-3 shadow-lg">
								<TemplateCard
									item={activeItem.item}
									type={activeItem.type}
									blockType={activeItem.blockType}
									isDragOverlay={true}
								/>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
				<BlockEditor />
			</div>
		</div>
	);
};

const Builder: React.FC = () => {
	return (
		<BuilderProvider>
			<BuilderContent />
		</BuilderProvider>
	);
};

export default Builder;
