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
		<div
			ref={setNodeRef}
			className={`relative transition-all ${isOver ? 'h-16' : 'h-0'}`}
		>
			{isOver && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-full relative">
						{/* Glowing line */}
						<div className="h-1 bg-blue-500 rounded-full shadow-lg animate-pulse" />
						<div className="absolute inset-0 h-1 bg-blue-400 blur-sm" />

						{/* Start indicator dot */}
						<div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />

						{/* End indicator dot */}
						<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />

						{/* Text label */}
						<div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-blue-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
							{__('Drop here to add section', 'doublescale')}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SectionDropZone;
