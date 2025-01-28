// BlockTypesList.tsx
import { useDraggable } from '@dnd-kit/core';
import { FC } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import classnames from 'classnames';
import { keys, map } from 'lodash';

interface DraggableBlockProps {
	name: string;
	blockType: any;
}

const DraggableBlock: FC<DraggableBlockProps> = ({ name, blockType }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		isDragging,
		transform,
	} = useDraggable({
		id: `${name}`, // Add 'panel-' prefix to distinguish from drop area blocks
		data: {
			type: 'PANEL_BLOCK',
			name
		}
	});

	const style = transform ? {
		transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
	} : undefined;

	return (
		<div
			ref={setNodeRef}
			className={classnames('block-item-wrapper', {
				'is-dragging': isDragging
			})}
			{...attributes}
			{...listeners}
			style={style}
		>
			<div className="qcrm-email-editor-blocks-list__item">
				<div className="qcrm-email-editor-blocks-list__item-icon">
					{blockType.icon}
				</div>
				<div className="qcrm-email-editor-blocks-list__item-title">
					{blockType.title}
				</div>
			</div>
		</div>
	);
};

const BlockTypesList: FC = () => {
	const { blockTypes } = useSelect((select) => ({
		blockTypes: select('quillcrm/email-editor-blocks').getBlockTypes(),
	}));

	return (
		<div id="BlocksPanel" className="qcrm-email-editor-blocks-panel">
			<div className="qcrm-email-editor-blocks-list">
				<div className="qcrm-email-editor-blocks-list__grid">
					{map(keys(blockTypes), (blockName) => (
						<DraggableBlock
							key={blockName}
							name={blockName}
							blockType={blockTypes[blockName]}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default BlockTypesList;