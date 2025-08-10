import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DragDropIcon } from '@/components/icons';

const TemplateCard = ({
	item,
	type,
	blockType,
	onCreateBlock,
}: {
	item: any;
	type: 'layout' | 'element';
	blockType?: string;
	onCreateBlock?: () => any;
}) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `template-${blockType || item.value}`,
			data: {
				type: 'template',
				blockType: blockType,
				item: item,
			},
		});

	const style = {
		transform: transform
			? `translate3d(${transform.x}px, ${transform.y}px, 0)`
			: undefined,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="w-full h-full text-xs bg-white rounded-md flex flex-col items-center justify-center border border-input text-muted-foreground p-4 gap-2 cursor-grab hover:cursor-grabbing hover:border-blue-300 transition-colors"
			key={item.value || blockType}
		>
			<DragDropIcon />
			<div className="flex flex-row gap-2 items-center justify-center w-full">
				{type === 'layout' &&
					item.number?.map((number, index) => (
						<div
							key={index}
							className="w-full h-full bg-border rounded-sm py-4"
							style={{ width: `${100 / number}%` }}
						></div>
					))}

				{type === 'element' && item.icon && (
					<div>
						<item.icon />
					</div>
				)}
			</div>
			{item.name}
		</div>
	);
};

export default TemplateCard;
