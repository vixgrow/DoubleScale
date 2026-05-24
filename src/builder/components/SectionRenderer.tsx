import React, { useState } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ArrowDown, ArrowUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailSection } from '../../stores/email-builder/types';
import ColumnRenderer from './ColumnRenderer';
import { ContactsIcon, CopyIcon, DeleteIcon, FiltersIcon } from '@doublescale/components';
import { EmailBuilderService } from '@/builder/services/EmailBuilderService';
import { DropIndicator } from './DropIndicator';
import ConditionalSectionGate from './ConditionalSectionGate';

interface SectionRendererProps {
	section: EmailSection;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section }) => {
	const dispatch = useDispatch();
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const [showConditionsModal, setShowConditionsModal] = useState(false);

	const {
		attributes,
		setNodeRef,
		transform,
		transition,
		isDragging,
		isOver,
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
	const hasConditions = section.conditions && section.conditions.length > 0;

	// Check if Pro is active for conditional sections
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const handleSectionClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).selectSection(section.id);
	};

	const handleDeleteSection = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(STORE_KEY).deleteSection(section.id);
	};

	const handleDuplicateSection = (e: React.MouseEvent) => {
		e.stopPropagation();
		const newSection = EmailBuilderService.duplicateSection(section);
		const sectionIndex = sections.findIndex((s) => s.id === section.id);
		dispatch(STORE_KEY).addSection(newSection, sectionIndex + 1);
	};

	const handleMoveSectionUp = (e: React.MouseEvent) => {
		e.stopPropagation();
		const currentIndex = sections.findIndex((s) => s.id === section.id);
		if (currentIndex > 0) {
			const targetSectionId = sections[currentIndex - 1].id;
			dispatch(STORE_KEY).reorderSections(section.id, targetSectionId);
		}
	};

	const handleMoveSectionDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		const currentIndex = sections.findIndex((s) => s.id === section.id);
		if (currentIndex < sections.length - 1) {
			const targetSectionId = sections[currentIndex + 1].id;
			dispatch(STORE_KEY).reorderSections(section.id, targetSectionId);
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				...section.styles,
				...(isSelected
					? { boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.14)' }
					: {}),
			}}
			{...attributes}
			className={`
				relative border-2 hover:border-blue-300 transition-colors
				${isSelected ? 'border-blue-500' : 'border-none'}
			`}
			onClick={handleSectionClick}
		>
			{/* Drop Indicator */}
			<DropIndicator position="top" isVisible={isOver} />

			{/* Conditional Section Badge */}
			{hasConditions && (
				<div className="absolute top-2 right-2 bg-secondary text-primary text-xs px-2 py-1 rounded-lg shadow-sm z-10 flex items-center gap-1">
					<ContactsIcon width={16} height={16} />
					{__('Conditional', 'doublescale')}
				</div>
			)}

			{/* Section Controls */}
			{isSelected && (
				<div className="absolute -top-[1.5px] h-[230px] -left-[43px] grid items-center gap-1 bg-white shadow-md rounded-l-xl p-2">
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-destructive hover:text-red-700"
						onClick={handleDeleteSection}
						title={__('Delete', 'doublescale')}
					>
						<DeleteIcon width={24} height={24} />
					</Button>
					<div className="border-b-2 border-accent"></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-accent-foreground"
						onClick={handleDuplicateSection}
						title={__('Duplicate', 'doublescale')}
					>
						<CopyIcon width={24} height={24} />
					</Button>
					<div className="border-b-2 border-accent"></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-primary"
						onClick={(e) => {
							e.stopPropagation();
							setShowConditionsModal(true);
						}}
						title={
							isProActive
								? __('Conditions', 'doublescale')
								: __('Conditions (Pro Feature)', 'doublescale')
						}
					>
						<FiltersIcon width={24} height={24} />
					</Button>
					<div className="border-b-2 border-accent"></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-primary"
						onClick={handleMoveSectionUp}
						title={__('Move Up', 'doublescale')}
					>
						<ArrowUp className="w-6 h-6" />
					</Button>
					<div className="border-b-2 border-accent"></div>
					<Button
						variant="ghost"
						size="lg"
						className="h-6 w-6 p-0 text-primary"
						onClick={handleMoveSectionDown}
						title={__('Move Down', 'doublescale')}
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

			{/* Conditional Section Modal - Gated by Pro */}
			<ConditionalSectionGate
				sectionId={section.id}
				visible={showConditionsModal}
				onClose={() => setShowConditionsModal(false)}
			/>
		</div>
	);
};

export default SectionRenderer;
