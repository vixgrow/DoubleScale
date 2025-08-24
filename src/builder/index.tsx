/**
 * external dependencies
 */
import React, { useState } from 'react';
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
	DragStartEvent,
	DragEndEvent,
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
	const { addNewSection, addNewBlock } = useBuilder();
	const sensors = useSensors(useSensor(PointerSensor));
	const [activeItem, setActiveItem] = useState<any>(null);

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		setActiveItem(active.data.current);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveItem(null);

		if (!over || active.id === over.id) return;

		console.log('active', active);
		console.log('over', over);

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
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[snapCenterToCursor]}
				>
					<Sidebar />
					<Canvas />
					<DragOverlay>
						{activeItem ? (
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
