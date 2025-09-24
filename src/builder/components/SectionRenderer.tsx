import React from 'react';
import { useSelect } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailSection } from '../../stores/email-builder/types';
import ColumnRenderer from './ColumnRenderer';
import { useBuilder } from '../context/BuilderContext';
import { CopyIcon, DeleteIcon } from '@quillcrm/components';

interface SectionRendererProps {
	section: EmailSection;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section }) => {
	const {
		selectBlock,
		deleteSection,
		duplicateSection,
		moveSectionUp,
		moveSectionDown,
		isTemplateSection,
		selectTemplateSection
	} = useBuilder();

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: section.id,
		data: {
			type: 'section',
			sectionId: section.id,
			section: section,
		},
	});

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
		// If this is a template section, use selectTemplateSection to show LayoutSettings
		if (isTemplateSection(section.id)) {
			selectTemplateSection(section.id);
		} else {
			selectBlock('', section.id);
		}
	};

	const handleDeleteSection = (e: React.MouseEvent) => {
		e.stopPropagation();
		deleteSection(section.id);
	};

	const handleDuplicateSection = (e: React.MouseEvent) => {
		e.stopPropagation();
		duplicateSection(section.id);
	};

	const handleMoveSectionUp = (e: React.MouseEvent) => {
		e.stopPropagation();
		moveSectionUp(section.id);
	};

	const handleMoveSectionDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		moveSectionDown(section.id);
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
				relative border-2 hover:border-blue-300 transition-colors
				${isSelected ? 'border-blue-500' : 'border-transparent'}
			`}
			onClick={handleSectionClick}
		>
			{/* Section Controls */}
			{isSelected && (
				<div className="absolute -top-[1.5px] h-[189.5px] -left-[43px] grid items-center gap-1 bg-white shadow-md rounded-l-xl p-2 border-2 border-blue-500"
				>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-secondary-foreground hover:text-red-700"
						onClick={handleDeleteSection}
						title={__('Delete', 'quillcrm')}
					>
						<DeleteIcon width={24} height={24}/>
					</Button>
					<div className='border-b-2 border-accent'></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-secondary-foreground"
						onClick={handleDuplicateSection}
						title={__('Duplicate', 'quillcrm')}
					>
						<CopyIcon width={24} height={24}/>
					</Button>
					<div className='border-b-2 border-accent'></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-secondary-foreground"
						onClick={handleMoveSectionUp}
						title={__('Move Up', 'quillcrm')}
					>
						<ArrowUp className="w-6 h-6" />
					</Button>
					<div className='border-b-2 border-accent'></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-secondary-foreground"
						onClick={handleMoveSectionDown}
						title={__('Move Down', 'quillcrm')}
					>
						<ArrowDown className="w-6 h-6" />
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
