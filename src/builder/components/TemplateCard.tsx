import { useDraggable } from '@dnd-kit/core';
import { DragDropIcon } from '@/components/icons';

const TemplateCard = ({
	item,
	type,
	blockType,
	onCreateBlock,
	isDragOverlay = false,
}: {
	item: any;
	type: 'layout' | 'element';
	blockType?: string;
	onCreateBlock?: () => any;
	isDragOverlay?: boolean;
}) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `template-${blockType || item.id}`,
		data: {
			type: type,
			blockType: blockType || item.id,
			item: item,
		},
		disabled: isDragOverlay,
	});

	const style = {
		opacity: isDragging && !isDragOverlay ? 0.5 : 1,
		zIndex: isDragging ? 1000 : 1,
	};

	const baseClasses =
		'w-full h-full text-xs bg-white rounded-md flex flex-col items-center justify-center border border-input text-muted-foreground p-4 gap-2 transition-colors';
	const interactiveClasses = isDragOverlay
		? 'cursor-grabbing border-blue-300 shadow-xl'
		: 'cursor-grab hover:cursor-grabbing hover:border-blue-300';

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`${baseClasses} ${interactiveClasses}`}
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
