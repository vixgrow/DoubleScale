// components/Canvas.jsx
import { useSelector, useDispatch } from 'react-redux';
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
} from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// import { reorderBlocks, selectBlock } from '../store/builderSlice';
// import { SortableItem } from './SortableItem';
// import { BlockRenderer } from './BlockRenderer';

const Canvas = () => {
	// const blocks = useSelector((state) => state.builder.blocks);
	// const dispatch = useDispatch();
	// const sensors = useSensors(useSensor(PointerSensor));

	// const handleDragEnd = (event) => {
	// 	const { active, over } = event;
	// 	if (active.id !== over.id) {
	// 		const oldIndex = blocks.findIndex((b) => b.id === active.id);
	// 		const newIndex = blocks.findIndex((b) => b.id === over.id);
	// 		dispatch(reorderBlocks({ fromIndex: oldIndex, toIndex: newIndex }));
	// 	}
	// };

	return (
		<DndContext
			// sensors={sensors}
			collisionDetection={closestCenter}
			// onDragEnd={handleDragEnd}
		>
			hey
			{/* <SortableContext
				items={blocks.map((b) => b.id)}
				strategy={verticalListSortingStrategy}
			>
				<div style={{ flex: 1, padding: 20, background: '#f5f5f5' }}>
					{blocks.map((block) => (
						<SortableItem key={block.id} id={block.id}>
							<BlockRenderer
								block={block}
								onClick={() => dispatch(selectBlock(block.id))}
							/>
						</SortableItem>
					))}
				</div>
			</SortableContext> */}
		</DndContext>
	);
};

export default Canvas;
