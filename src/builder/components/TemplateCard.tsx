import { DragDropIcon } from '@/components/icons';

const TemplateCard = ({
	item,
	type,
}: {
	item: any;
	type: 'layout' | 'element';
}) => {
	return (
		<div
			className="w-full h-full bg-primary-foreground rounded-md flex flex-col items-center justify-center border border-input text-muted-foreground p-4 gap-2 cursor-move"
			key={item.value}
		>
			<DragDropIcon />
			<div className="flex flex-row gap-2 items-center justify-center w-full">
				{type === 'layout' &&
					item.number.map((number) => (
						<div
							key={number}
							className="w-full h-full bg-border rounded-sm py-4"
							style={{ width: `${100 / number}%` }}
						></div>
					))}

				{type === 'element' && (
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
