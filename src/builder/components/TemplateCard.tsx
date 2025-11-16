import { useDraggable } from '@dnd-kit/core';
import { DragDropIcon, PremiumIcon } from '@/components/icons';

const TemplateCard = ({
	item,
	type,
	blockType,
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
		disabled: isDragOverlay || (item.isPro && !item.isProActivated),
	});

	const style = {
		opacity: isDragging && !isDragOverlay ? 0.5 : 1,
		zIndex: isDragging ? 1000 : 1,
	};

	const baseClasses =
		'relative w-full h-full text-xs bg-white rounded-md flex flex-col items-center justify-center border border-input text-muted-foreground p-4 gap-2 transition-colors text-center';
	const interactiveClasses =
		item.isPro && !item.isProActivated
			? 'cursor-not-allowed opacity-70'
			: isDragOverlay
				? 'cursor-grabbing border-blue-300 shadow-xl'
				: 'cursor-grab hover:cursor-grabbing hover:border-blue-300';

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...(!item.isPro || item.isProActivated ? listeners : {})}
			{...(!item.isPro || item.isProActivated ? attributes : {})}
			className={`${baseClasses} ${interactiveClasses}`}
			key={item.value || blockType}
		>
			{item.isPro && !item.isProActivated ? (
				<div className="absolute top-2 right-2">
					<PremiumIcon width={16} height={16} />
				</div>
			) : (
				<DragDropIcon />
			)}
			<div className="flex flex-row gap-2 items-center justify-center w-full">
				{type === 'layout' &&
					item.width?.map((width, index) => (
						<div
							key={index}
							className="w-full h-full bg-border rounded-sm py-4"
							style={{ width: `${width}%` }}
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
