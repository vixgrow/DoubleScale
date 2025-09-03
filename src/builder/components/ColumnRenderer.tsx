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
	const hasInlineLayout = inlineBlocks.length > 0;

	// Group blocks by containerId for inline layout
	const groupedBlocks = hasInlineLayout
		? column.blocks.reduce(
				(groups, block) => {
					if (block.props?.containerId) {
						if (!groups[block.props.containerId]) {
							groups[block.props.containerId] = [];
						}
						groups[block.props.containerId].push(block);
					} else {
						// Regular blocks go to a special group
						if (!groups['regular']) {
							groups['regular'] = [];
						}
						groups['regular'].push(block);
					}
					return groups;
				},
				{} as Record<string, any[]>
			)
		: { regular: column.blocks };

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
						{Object.entries(groupedBlocks).map(
							([groupId, blocks]) => {
								// If this is an inline layout group (not 'regular'), render in flex container
								if (groupId !== 'regular') {
									return (
										<div
											key={groupId}
											className="flex justify-between items-center w-full gap-4 mb-4"
										>
											{blocks.map((block) => (
												<BlockRenderer
													key={block.id}
													block={block}
													sectionId={sectionId}
													columnId={column.id}
												/>
											))}
										</div>
									);
								}

								// Regular blocks render normally
								return blocks.map((block) => (
									<BlockRenderer
										key={block.id}
										block={block}
										sectionId={sectionId}
										columnId={column.id}
									/>
								));
							}
						)}

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
