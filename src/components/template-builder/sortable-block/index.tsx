import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSelect } from '@wordpress/data';
import classNames from 'classnames';
const SortableBlock = ({ id, attributes, blockName }) => {
    const {
        attributes: sortableAttributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        data: {
            type: 'EXISTING_BLOCK'
        }
    });

    const { blockTypes } = useSelect((select) => ({
        blockTypes: select('quillcrm/email-editor-blocks').getBlockTypes(),
    }));

    const BlockType = blockTypes[blockName];



    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            className={classNames('sortable-block', {
                'is-dragging': isDragging
            })}
            style={style}
            {...sortableAttributes}
            {...listeners}
        >
            <div className="sortable-block__content">
                <BlockType.edit
                    id={id}
                    attributes={attributes}
                />
            </div>
        </div>
    );
};

export default SortableBlock;