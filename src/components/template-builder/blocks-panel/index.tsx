/* eslint-disable no-shadow */
/**
 * Internal Dependencies
 */
import {
	Draggable,
	Droppable,
} from 'react-beautiful-dnd';
// import BlockTypesListItem from '../block-types-list-item';

/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * External Dependencies
 */
import classnames from 'classnames';
import { keys, map } from 'lodash';
import { FC } from 'react';

/**
 * 
 * Internal Dependencies
 */
import './style.scss';

const BlockTypesList: FC = () => {
	const { blockTypes } = useSelect((select) => {
		const blockTypes = select('quillcrm/email-editor-blocks').getBlockTypes();
		return {
			blockTypes,
		};
	});
	return (
		<div className="qcrm-email-editor-blocks-list">
			<Droppable droppableId="BLOCKS_LIST" isDropDisabled={true}>
				{(provided, _snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.droppableProps}
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)', // Two columns
							gap: '16px', // Gap between items
						}}
					>

						{map(keys(blockTypes), (blockName, index) => {
							const blockType = blockTypes[blockName];

							return (
								<div
									key={blockName}
									style={{
										marginBottom: '20px',
										overflow: 'auto',
									}}
								>
									<Draggable

										draggableId={blockName}
										index={index}
									>
										{(provided, snapshot) => (
											<Fragment>
												<div
													className={classnames(
														'admin-components-blocks-list__item-wrapper',
														{
															'is-dragging': snapshot.isDragging
																? true
																: false,
														}
													)}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													ref={provided.innerRef}
													style={{
														userSelect: 'none',
														margin: '0',
														...provided.draggableProps.style
													}}
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
												{snapshot.isDragging && (
													<div className="qcrm-email-editor-blocks-list__item">
														<div className="qcrm-email-editor-blocks-list__item-icon">
															{blockType.icon}
														</div>
														<div className="qcrm-email-editor-blocks-list__item-title">
															{blockType.title}
														</div>
													</div>
												)}
											</Fragment>
										)}
									</Draggable>
								</div>
							);
						})}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</div>
	);
};

export default BlockTypesList;