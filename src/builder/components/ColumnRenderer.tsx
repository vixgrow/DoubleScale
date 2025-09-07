/**
 * wordpress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailColumn } from '../../stores/email-builder/types';
import BlockRenderer from './BlockRenderer';
// @ts-ignore
import dropIcon from '../../../assets/images/drop-icon.png';

interface ColumnRendererProps {
	column: EmailColumn;
	sectionId: string;
}

const ColumnRenderer: React.FC<ColumnRendererProps> = ({
	column,
	sectionId,
}) => {
	const dispatch = useDispatch();

	const { isOver, setNodeRef } = useDroppable({
		id: `column-${column.id}`,
		data: {
			type: 'column',
			columnId: column.id,
			sectionId: sectionId,
		},
	});

	const addTextBlock = () => {
		const newBlock = {
			id: `block-${Date.now()}`,
			type: 'text' as const,
			props: {
				content: __('Your text here', 'quillcrm'),
				fontSize: 16,
				color: '#333',
				align: 'left',
			},
		};

		dispatch(STORE_KEY).addBlock(sectionId, column.id, newBlock);
	};

	// Check if this column has inline layout blocks (for logo+button)
	const inlineBlocks = column.blocks.filter(
		(block) => block.props?.inlineLayout
	);

	return (
		<div
			ref={setNodeRef}
			className={`
				min-h-24 p-4
				${isOver ? 'bg-blue-50' : ''}
			`}
			style={{
				width: `${100 / column.width}%`,
			}}
		>
			<SortableContext
				items={column.blocks.map((b) => b.id)}
				strategy={verticalListSortingStrategy}
			>
				{column.blocks.length === 0 ? (
					<div className="bg-[#EBF4FB] rounded-md text-center p-8">
						<div className="text-muted-foreground flex flex-col items-center gap-2">
							<img
								src={dropIcon}
								alt="Drop Icon"
								width={24}
								height={24}
							/>
							<p className="text-sm text-secondary">
								{__('Drop Content Here', 'quillcrm')}
							</p>
						</div>
					</div>
				) : (
					<>
						{(() => {
							const renderedBlocks: React.ReactNode[] = [];
							let i = 0;

							while (i < column.blocks.length) {
								const block = column.blocks[i];

								// Check if this block starts a side-by-side layout group
								if (block.props?.sideBySideLayout) {
									const sideBySideBlocks: any[] = [];
									const leftBlocks: any[] = [];
									const rightBlocks: any[] = [];

									// Collect all blocks with sideBySideLayout
									while (i < column.blocks.length && column.blocks[i].props?.sideBySideLayout) {
										sideBySideBlocks.push(column.blocks[i]);
										i++;
									}

									// Separate left and right blocks
									sideBySideBlocks.forEach((block) => {
										if (block.props?.sideBySidePosition === 'left') {
											leftBlocks.push(block);
										} else if (block.props?.sideBySidePosition === 'right') {
											rightBlocks.push(block);
										}
									});

									// Render the side-by-side layout
									if (sideBySideBlocks.length > 0) {
										renderedBlocks.push(
											<div
												key={`side-by-side-${sideBySideBlocks[0].id}`}
												className="flex w-full mb-4"
												style={{
													gap: '10px',
													alignItems: 'flex-start',
												}}
											>
												{/* Left side - Image */}
												<div style={{ flexBasis: '50%', flexShrink: 0 }}>
													{leftBlocks.map((block) => (
														<BlockRenderer
															key={block.id}
															block={block}
															sectionId={sectionId}
															columnId={column.id}
														/>
													))}
												</div>
												{/* Right side - Content blocks */}
												<div style={{ flexBasis: '50%', flexShrink: 0 }}>
													{rightBlocks.map((block) => (
														<BlockRenderer
															key={block.id}
															block={block}
															sectionId={sectionId}
															columnId={column.id}
														/>
													))}
												</div>
											</div>
										);
									}
								}
								// Check if this block starts an inline layout group
								else if (block.props?.inlineLayout && block.props?.containerId) {
									const containerId = block.props.containerId;
									const inlineBlocks: any[] = [];

									// Collect all blocks with the same containerId
									while (i < column.blocks.length &&
										column.blocks[i].props?.inlineLayout &&
										column.blocks[i].props?.containerId === containerId) {
										inlineBlocks.push(column.blocks[i]);
										i++;
									}

									// Render the inline layout group
									if (inlineBlocks.length > 0) {
										const firstBlock = inlineBlocks[0];
										const templateLayout = firstBlock.props?.templateLayout;

										renderedBlocks.push(
											<div
												key={`inline-${containerId}`}
												className="flex w-full mb-4"
												style={{
													justifyContent: templateLayout?.justifyContent || 'flex-start',
													gap: templateLayout?.gap || '0px',
													alignItems: templateLayout?.alignItems || 'flex-start',
													flexWrap: templateLayout?.flexWrap || 'nowrap',
													width: templateLayout?.width || '100%',
												}}
											>
												{inlineBlocks.map((block) => (
													<div
														key={block.id}
														style={{
															flexBasis: block.props?.flexBasis || 'auto',
															flexGrow: block.props?.flexGrow || 0,
															flexShrink: block.props?.flexShrink || 1,
														}}
													>
														<BlockRenderer
															block={block}
															sectionId={sectionId}
															columnId={column.id}
														/>
													</div>
												))}
											</div>
										);
									}
								} else {
									// Render regular block
									renderedBlocks.push(
										<BlockRenderer
											key={block.id}
											block={block}
											sectionId={sectionId}
											columnId={column.id}
										/>
									);
									i++;
								}
							}

							return renderedBlocks;
						})()}

						{/* Add Block Button */}
						<div className="mt-4 pt-4 border-t border-dashed border-gray-200">
							<Button
								variant="ghost"
								size="sm"
								className="w-full text-muted-foreground"
								onClick={addTextBlock}
							>
								<Plus className="w-4 h-4 mr-2" />
								{__('Add Block', 'quillcrm')}
							</Button>
						</div>
					</>
				)}
			</SortableContext>
		</div>
	);
};

export default ColumnRenderer;
