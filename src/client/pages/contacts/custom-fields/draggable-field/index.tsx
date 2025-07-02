/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { MoveIcon } from '@quillcrm/components';
import { CustomField } from '@quillcrm/client';


interface DraggableFieldProps {
	field: CustomField;
	children: React.ReactNode;
}

export const DraggableField: React.FC<DraggableFieldProps> = ({
	field,
	children,
}) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `field-${field.id}`,
			data: {
				type: 'field',
				field,
			},
		});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={isDragging ? 'opacity-50' : ''}
		>
			<Button
				size="sm"
				variant="outline"
				className="text-[#292D32] border-accent shadow-none hover:bg-gray-50 p-2 cursor-grab active:cursor-grabbing"
				title={__('Move field', 'quillcrm')}
			>
				<MoveIcon width={16} height={16} />
			</Button>
		</div>
	);
};
