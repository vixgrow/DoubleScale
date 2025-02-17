// DropArea.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import SortableBlock from '../sortable-block';
import DropAreaPlaceholder from '../drop-area-placeholder';

const BlockDragIndexLine = () => {
    return <div className="block-drag-index-line"></div>;
};


const DropArea = ({ items = [], targetIndex, isDragging }) => {

    const { setNodeRef, isOver } = useDroppable({
        id: 'DROP_AREA',
    });

    // Only show drag line when targetIndex is not null and we're dragging
    const showDragLine = isDragging && targetIndex !== null;

    return (
        <div className="qcrm-email-editor-drop-area">
            <div
                ref={setNodeRef}
                className={classNames(
                    'qcrm-email-editor-drop-area__container',
                    {
                        'is-dragging-over': isOver,
                        'is-dragging': isDragging,
                    }
                )}
            >
                {!items.length ? (
                    <DropAreaPlaceholder isDraggingOver={isOver} />
                ) : (
                    <SortableContext
                        items={items.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="blocks-container">
                            {showDragLine && targetIndex === 0 && <BlockDragIndexLine />}
                            {items.map((block, index) => {
                                console.log(block);
                                return (
                                    <Fragment key={block.id}>
                                        <SortableBlock
                                            blockName={block.name}
                                            id={block.id}
                                            attributes={block.attributes}
                                        />
                                        {showDragLine && targetIndex === index + 1 && (
                                            <BlockDragIndexLine />
                                        )}
                                    </Fragment>
                                );
                            })}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};

export default DropArea;