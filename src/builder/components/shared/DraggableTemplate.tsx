/**
 * External dependencies
 */
import { useDraggable } from '@dnd-kit/core';
/**
 * Internal dependencies
 */
import { PremiumIcon } from '@/components/icons';

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
		| 'preheader'
		| 'saved-block';
	disabled?: boolean;
}

export const DraggableTemplate: React.FC<DraggableTemplateProps> = ({
	template,
	id,
	children,
	templateType,
	disabled = false,
}) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `template-${id}`,
		data: {
			type: `${templateType}-template`,
			template: template,
		},
		disabled: disabled,
	});

	return (
		<div
			ref={setNodeRef}
			{...(!disabled ? listeners : {})}
			{...(!disabled ? attributes : {})}
			className={`group relative transition-all ${
				disabled
					? 'cursor-not-allowed opacity-70'
					: 'cursor-grab active:cursor-grabbing'
			} ${isDragging ? 'opacity-50' : ''}`}
		>
			{disabled && (
				<div className="absolute top-2 right-2 p-1 bg-[#FAEADF] rounded-full z-10">
					<PremiumIcon />
				</div>
			)}
			{children}
		</div>
	);
};
