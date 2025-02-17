import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableBlock from '../../../../components/template-builder/sortable-block';
import classNames from 'classnames';

const Edit: React.FC = ({ attributes, setAttributes, id }) => {
    const { columns, children } = attributes;

    return (
        <div className="qcrm-layout-block">
            <div className="qcrm-layout-columns" style={{ display: 'flex', gap: '10px' }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <LayoutColumn
                        key={index}
                        columnIndex={index}
                        children={children[index] || []}
                        setAttributes={setAttributes}
                        layoutBlockId={id} // Pass the block ID for column-specific droppable handling
                    />
                ))}
            </div>
        </div>
    );
};

const LayoutColumn = ({ columnIndex, children, setAttributes, layoutBlockId }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `layout-column-${columnIndex}`,
        data: {
            type: 'LAYOUT_COLUMN',
            columnIndex,
            layoutBlockId,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={classNames('qcrm-layout-column', {
                'is-dragging-over': isOver,
            })}
        >
            <SortableContext
                items={children.map((child) => child.id)}
                strategy={verticalListSortingStrategy}
            >
                {targetIndex === 0 && <div className="block-drag-index-line" />}
                {children.map((child, index) => (
                    <React.Fragment key={child.id}>
                        <SortableBlock
                            id={child.id}
                            blockName={child.name}
                            attributes={child.attributes}
                        />
                        {targetIndex === index + 1 && <div className="block-drag-index-line" />}
                    </React.Fragment>
                ))}
            </SortableContext>
        </div>
    );
};

export default Edit;