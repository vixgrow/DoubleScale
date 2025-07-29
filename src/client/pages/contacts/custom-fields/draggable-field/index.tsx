/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useEffect, useRef, useCallback } from 'react';
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
	const tableRowRef = useRef<HTMLTableRowElement | null>(null);
	const dragElementRef = useRef<HTMLDivElement | null>(null);

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `field-${field.id}`,
		data: {
			type: 'field',
			field,
		},
	});

	// Combined ref callback
	const combinedRef = useCallback(
		(element: HTMLDivElement | null) => {
			dragElementRef.current = element;
			setNodeRef(element);

			if (element) {
				const tableRow = element.closest('tr');
				tableRowRef.current = tableRow;
			}
		},
		[setNodeRef]
	);

	useEffect(() => {
		const tableRow = tableRowRef.current;
		if (tableRow) {
			if (isDragging) {
				tableRow.style.opacity = '0.3';
			} else {
				tableRow.style.opacity = '';
			}
		}
	}, [isDragging]);

	return (
		<div ref={combinedRef} {...attributes} {...listeners}>
			{children}
		</div>
	);
};
