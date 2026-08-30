/**
 * Section Drop Zone Component
 * Shows where a new section (from layout) will be inserted
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { __ } from '@wordpress/i18n';

interface SectionDropZoneProps {
	position: 'before' | 'after';
	sectionId: string;
	index: number;
	isFirst?: boolean;
	isLast?: boolean;
}

export const SectionDropZone: React.FC<SectionDropZoneProps> = ({
	position,
	sectionId,
	index,
}) => {
	const dropZoneId = `drop-zone-${position}-${sectionId}`;

	const { isOver, setNodeRef } = useDroppable({
		id: dropZoneId,
		data: {
			type: 'section-drop-zone',
			position,
			sectionId,
			index,
		},
	});

	return (
		<div className="relative z-20 h-0">
			<div
				ref={setNodeRef}
				className={`absolute inset-x-0 flex items-center justify-center ${
					isOver ? '-top-8 h-16' : '-top-3 h-6'
				}`}
			>
				{isOver && (
					<div className="relative w-full">
						<div className="h-1 bg-blue-500 rounded-full shadow-lg animate-pulse" />
						<div className="absolute inset-0 h-1 bg-blue-400 blur-sm" />
						<div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
						<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
						<div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-blue-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
							{__('Drop here to add section', 'doublescale')}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SectionDropZone;
