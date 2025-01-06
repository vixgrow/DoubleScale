
// We need to implement our own InserterSidebar component with drag and drop to replace the one that comes with the block editor.
// We can use the useDispatch and useSelect hooks to interact with the block editor.

import { useDispatch, useSelect } from '@wordpress/data';
// Please decide if we should use a wordpress lib for drag and drop or external lib

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


export default function InserterSidebar() {

    const { insertBlock } = useDispatch('core/block-editor');
    const { getBlockTypes } = useSelect((select) => select('core/blocks'));
    const blockTypes = getBlockTypes();

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const blockType = blockTypes[result.source.index];
        insertBlock(blockType.name);
    };

    return (
        <Droppable droppableId="droppable">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    {blockTypes.map((blockType, index) => (
                        <Draggable key={blockType.name} draggableId={blockType.name} index={index}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    {blockType.title}
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );

}