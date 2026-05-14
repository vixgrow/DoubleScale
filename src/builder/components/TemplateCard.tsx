import { useDraggable } from '@dnd-kit/core';
import { DragDropIcon, PremiumIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';

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
		backgroundColor: 'rgba(255,255,255,0.05)',
	};

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
			className={cn(
				'relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg p-4 text-center text-sm transition-colors',
				isDragOverlay ? 'text-foreground' : 'text-white',
				interactiveClasses
			)}
			key={item.value || blockType}
		>
			{item.isPro && !item.isProActivated && (
				<div className="absolute top-2 right-2 p-1 bg-[#FAEADF] rounded-full">
					<PremiumIcon />
				</div>
			)}
			{type === 'layout' && (
				<DragDropIcon width={20} height={20} />
			)}
			<div className="flex flex-row gap-2 items-center justify-center w-full">
				{type === 'layout' &&
					item.width?.map((width, index) => (
						<div
							key={index}
							className={cn(
								'h-full w-full rounded-sm py-4',
								isDragOverlay
									? 'bg-muted-foreground/35'
									: 'bg-white/60'
							)}
							style={{ width: `${width}%` }}
						></div>
					))}

				{type === 'element' && item.icon && (
					<div
						className={cn(
							'shrink-0',
							isDragOverlay ? 'text-foreground' : 'text-white'
						)}
					>
						<item.icon />
					</div>
				)}
			</div>
			{item.name}
		</div>
	);
};

export default TemplateCard;
