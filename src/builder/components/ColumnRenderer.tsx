import React from 'react';
import { useDispatch } from '@wordpress/data';
import { useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailColumn } from '../../stores/email-builder/types';
import BlockRenderer from './BlockRenderer';

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

	return (
		<div
			ref={setNodeRef}
			className={`
				min-h-24 p-4 border-r border-dashed border-gray-200 last:border-r-0
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
					<div className="text-center py-8">
						<div className="text-muted-foreground mb-4">
							<Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
							<p className="text-sm">
								{__(
									'Drop blocks here or click to add',
									'quillcrm'
								)}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={addTextBlock}
						>
							{__('Add Text Block', 'quillcrm')}
						</Button>
					</div>
				) : (
					<>
						{column.blocks.map((block) => (
							<BlockRenderer
								key={block.id}
								block={block}
								sectionId={sectionId}
								columnId={column.id}
							/>
						))}

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
