/**
 * external dependencies
 */
import React from 'react';
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
} from '@dnd-kit/core';
import { useDispatch } from '@wordpress/data';
import { v4 as uuidv4 } from 'uuid';
/**
 * internal dependencies
 */
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BlockEditor from './components/BlockEditor';
import { STORE_KEY } from '../stores/email-builder/constants';
import { blocksRegistry } from './blocks/BlockRegister';

const Builder: React.FC = () => {
	const dispatch = useDispatch();
	const sensors = useSensors(useSensor(PointerSensor));

	const handleDragEnd = (event: any) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		// Handle dropping new blocks from sidebar
		if (active.data?.current?.type === 'template') {
			const { blockType } = active.data.current;
			const overData = over.data?.current;

			if (overData?.type === 'column') {
				const { sectionId, columnId } = overData;

				// Create new block
				const newBlock = {
					id: uuidv4(),
					type: blockType,
					props: blocksRegistry[blockType]?.defaultProps || {},
				};

				dispatch(STORE_KEY).addBlock(sectionId, columnId, newBlock);
				return;
			}
		}

		// Handle block reordering within canvas
		// This is a simplified version - you might want to implement more complex logic
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
					onDragEnd={handleDragEnd}
				>
					<Sidebar />
					<Canvas />
					<DragOverlay>{/* Render dragged item here */}</DragOverlay>
				</DndContext>
				<BlockEditor />
			</div>
		</div>
	);
};

export default Builder;
