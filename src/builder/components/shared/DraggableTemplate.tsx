/**
 * External dependencies
 */
import { useDraggable } from '@dnd-kit/core';
interface DraggableTemplateProps {
	template: any;
	id: string;
	children: React.ReactNode;
	templateType:
		| 'header'
		| 'footer'
		| 'email-body'
		| 'hero-image'
		| 'image-gallery'
		| 'preheader';
}

export const DraggableTemplate: React.FC<DraggableTemplateProps> = ({
	template,
	id,
	children,
	templateType,
}) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `template-${id}`,
		data: {
			type: `${templateType}-template`,
			template: template,
		},
	});

	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className={`group relative cursor-grab active:cursor-grabbing transition-all ${
				isDragging ? 'opacity-50' : ''
			}`}
		>
			{children}
		</div>
	);
};
