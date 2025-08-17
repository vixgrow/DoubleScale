import React from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailSection } from '../../stores/email-builder/types';
import ColumnRenderer from './ColumnRenderer';

interface SectionRendererProps {
	section: EmailSection;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section }) => {
	const dispatch = useDispatch();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: section.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const selectedSectionId = useSelect(
		(select) => select(STORE_KEY).getSelectedSectionId(),
		[]
	);

	const isSelected = selectedSectionId === section.id;

	const handleSectionClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).selectBlock('', section.id);
	};

	const handleDeleteSection = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).deleteSection(section.id);
	};

	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				...section.styles,
			}}
			{...attributes}
			className={`
				relative border-2 border-transparent hover:border-blue-200 transition-colors
				${isSelected ? 'border-blue-400' : ''}
			`}
			onClick={handleSectionClick}
		>
			{/* Section Controls */}
			{isSelected && (
				<div className="absolute -top-8 left-0 flex items-center gap-2 bg-white shadow-md rounded px-2 py-1 text-xs">
					<div
						{...listeners}
						className="cursor-grab hover:cursor-grabbing flex items-center text-muted-foreground"
					>
						<GripVertical className="w-3 h-3" />
					</div>
					<span className="text-muted-foreground">
						{__('Section', 'quillcrm')}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
						onClick={handleDeleteSection}
					>
						<Trash2 className="w-3 h-3" />
					</Button>
				</div>
			)}

			{/* Section Content */}
			<div className="flex">
				{section.columns.map((column) => (
					<ColumnRenderer
						key={column.id}
						column={column}
						sectionId={section.id}
					/>
				))}
			</div>
		</div>
	);
};

export default SectionRenderer;
