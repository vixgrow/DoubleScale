/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useDraggable } from '@dnd-kit/core';

/**
 * Internal dependencies
 */
import { DragDropIcon } from '@/components/icons';

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
			className={`relative cursor-grab active:cursor-grabbing transition-all ${
				isDragging ? 'opacity-50' : ''
			}`}
		>
			<div className="absolute top-2 right-2 z-10 bg-white rounded-lg shadow-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
				<DragDropIcon className="w-4 h-4 text-gray-600" />
			</div>
			{children}
		</div>
	);
};
