/**
 * external dependencies
 */
import React, { useState } from 'react';
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
	DragStartEvent,
	DragEndEvent,
	TouchSensor,
	KeyboardSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
/**
 * internal dependencies
 */
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BlockEditor from './components/BlockEditor';
import TemplateCard from './components/TemplateCard';
import { BuilderProvider, useBuilder } from './context/BuilderContext';

const BuilderContent: React.FC = () => {
	const { addNewSection, addNewBlock, addNewBlockWithProps } = useBuilder();
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor)
	);
	const [activeItem, setActiveItem] = useState<any>(null);

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		console.log('Drag started:', active);
		console.log('Active data:', active.data?.current);
		setActiveItem(active.data.current);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		console.log('Drag ended - active:', active);
		console.log('Drag ended - over:', over);
		console.log('Active data current:', active.data?.current);
		console.log('Over data current:', over?.data?.current);

		setActiveItem(null);

		if (!over || active.id === over.id) {
			console.log('No valid drop target or same item');
			return;
		}

		console.log('Processing drop...');

		// Handle dropping library templates - ONLY into sections/columns
		if (active.data?.current?.type === 'library-template') {
			const template = active.data.current.template;
			console.log('Library template detected:', template);

			// ONLY allow dropping into sections or columns
			const overData = over.data?.current;
			if (overData?.type === 'column' || overData?.type === 'section') {
				console.log(
					'Dropping library template into section/column:',
					overData
				);

				// Add the template as a single block
				if (template.type === 'preheader') {
					console.log(
						'Creating single block for template:',
						template
					);

					// Use the new addNewBlockWithProps function to add the single block with custom props
					if (
						overData.type === 'column' &&
						overData.sectionId &&
						overData.columnId
					) {
						console.log(
							'Adding single block to column with props:',
							template.props
						);
						addNewBlockWithProps(
							overData.sectionId,
							overData.columnId,
							template.type,
							template.props
						);
					} else if (
						overData.type === 'section' &&
						overData.sectionId
					) {
						// If dropping into a section (not a specific column), add to the first column
						console.log(
							'Adding single block to section with props:',
							template.props
						);
						addNewBlockWithProps(
							overData.sectionId,
							'column-1',
							template.type,
							template.props
						);
					}
				}
				return;
			} else {
				// If trying to drop on canvas or other invalid areas, ignore it
				console.log(
					'Library template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle dropping new blocks from sidebar
		if (active.data?.current?.type === 'element') {
			const { blockType } = active.data.current;
			const overData = over.data?.current;

			if (overData?.type === 'column') {
				const { sectionId, columnId } = overData;
				addNewBlock(sectionId, columnId, blockType);
				return;
			}
		}

		// Handle dropping new sections
		if (active.data?.current?.type === 'layout') {
			addNewSection(active.data.current.item);
		}

		console.log('Drag ended:', { active: active.id, over: over.id });
	};

	const renderDragOverlay = () => {
		if (!activeItem) return null;

		// Handle library template overlay
		if (activeItem.type === 'library-template') {
			return (
				<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
					<div className="text-sm font-medium text-gray-700">
						'Text & Link'
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Library Template
					</div>
				</div>
			);
		}

		// Handle existing template overlays
		if (activeItem.item) {
			return (
				<div className="opacity-90 transform rotate-3 shadow-lg">
					<TemplateCard
						item={activeItem.item}
						type={activeItem.type}
						blockType={activeItem.blockType}
						isDragOverlay={true}
					/>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="flex flex-col absolute top-0 left-0 right-0 bottom-0 z-50 bg-primary-foreground">
			<Header />
			<div
				className="flex flex-1 pt-1"
				style={{ backgroundColor: '#e6eff7' }}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[snapCenterToCursor]}
				>
					<Sidebar />
					<Canvas />
					<DragOverlay>{renderDragOverlay()}</DragOverlay>
				</DndContext>
				<BlockEditor />
			</div>
		</div>
	);
};

const Builder: React.FC = () => {
	return (
		<BuilderProvider>
			<BuilderContent />
		</BuilderProvider>
	);
};

export default Builder;
