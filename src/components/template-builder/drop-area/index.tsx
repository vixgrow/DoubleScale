/* eslint-disable no-nested-ternary */
/**
 * QuillForms Dependencies
 */
import { Draggable, Droppable } from 'react-beautiful-dnd';

/**
 * Wordpress Dependencies
 */
import { Fragment } from 'react';
import { useSelect } from '@wordpress/data';

/**
 * External Dependencies.
 */
import classNames from 'classnames';
import DropAreaPlaceholder from '../drop-area-placeholder';
const BlockDragIndexLine = () => {
    return <div className="block-drag-index-line"></div>;
};

const DropArea = (props) => {
    const { targetIndex, isDragging } = props;
    const { formBlocks, blockTypes } = useSelect((select) => {
        return {
            formBlocks: select('quillcrm/email-editor').getBlocks(),
            blockTypes: select('quillcrm/email-editor-blocks').getBlockTypes(),
        };
    });

    return (
        <div
            className="qcrm-email-editor-drop-area"

        >
            <Droppable
                droppableId="DROP_AREA"
            >
                {(provided, snapshot) => (
                    <div
                        className={classNames(
                            'qcrm-email-editor-drop-area__container',
                            {
                                'disable-hover-highlight':
                                    isDragging || snapshot.isDraggingOver,
                            }
                        )}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {!formBlocks || formBlocks.length === 0 ? (
                            <DropAreaPlaceholder
                                isDraggingOver={snapshot.isDraggingOver}
                            />
                        ) : (
                            <>
                                {
                                    formBlocks.map((block, index) => {
                                        const BlockType = blockTypes[block.name];
                                        return (
                                            <Fragment key={block.id}>
                                                {index === targetIndex && (
                                                    <BlockDragIndexLine />
                                                )}
                                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                                    {(provided) => (
                                                        <>
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <BlockType.edit id={block.id} attributes={block.attributes} />
                                                            </div>
                                                        </>

                                                    )}
                                                </Draggable>
                                            </Fragment>
                                        );
                                    })
                                }
                                {targetIndex === formBlocks.length && (
                                    <BlockDragIndexLine />
                                )}
                            </>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
export default DropArea;
