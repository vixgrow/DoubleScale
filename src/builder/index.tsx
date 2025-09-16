/**
 * external dependencies
 */
import React, { useState } from 'react';
import {
	DndContext,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
	DragStartEvent,
	DragEndEvent,
	TouchSensor,
	KeyboardSensor,
	pointerWithin,
	closestCenter,
	CollisionDetection,
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
import { useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../stores/email-builder/constants';
import { v4 as uuidv4 } from 'uuid';

const BuilderContent: React.FC = () => {
	const {
		addNewSection,
		addNewBlock,
		addNewBlockWithProps,
		reorderSections,
		moveBlock,
	} = useBuilder();
	const dispatch = useDispatch();
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

	// Custom collision detection that prioritizes sections when dragging sections and columns when dragging blocks
	const customCollisionDetection: CollisionDetection = (args) => {
		const { active, droppableContainers } = args;

		// If we're dragging a section, only consider other sections for collision
		if (active.data?.current?.type === 'section') {
			const sectionContainers = Array.from(
				droppableContainers.values()
			).filter(
				(container) => container.data?.current?.type === 'section'
			);

			// Use closestCenter for section-to-section collision detection
			return closestCenter({
				...args,
				droppableContainers: sectionContainers,
			});
		}

		// If we're dragging a library template, ONLY consider canvas for collision
		if (
			active.data?.current?.type === 'library-template' ||
			active.data?.current?.type === 'header-template' ||
			active.data?.current?.type === 'email-body-template' ||
			active.data?.current?.type === 'hero-image-template' ||
			active.data?.current?.type === 'image-gallery-template' ||
			active.data?.current?.type === 'footer-template'
		) {
			// Only allow dropping on canvas
			const canvasContainers = Array.from(
				droppableContainers.values()
			).filter(
				(container) =>
					container.id === 'canvas' ||
					container.id === 'canvas-blocks'
			);

			// Use pointerWithin for canvas detection
			return pointerWithin({
				...args,
				droppableContainers: canvasContainers,
			});
		}

		// If we're dragging a block or element, only consider columns for collision
		if (
			active.data?.current?.type === 'block' ||
			active.data?.current?.type === 'element'
		) {
			const columnContainers = Array.from(
				droppableContainers.values()
			).filter((container) => container.data?.current?.type === 'column');

			// Use closestCenter for block-to-column collision detection
			return closestCenter({
				...args,
				droppableContainers: columnContainers,
			});
		}

		// For all other drag operations, use the default pointerWithin
		return pointerWithin(args);
	};

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		console.log('Drag started:', active);
		console.log('Active data:', active.data?.current);

		// Check if this is a section being sorted (from useSortable)
		if (active.data?.current?.type === 'section') {
			// This is a section being sorted - don't set activeItem
			setActiveItem(null);
			return;
		}

		// Check if this is a block being sorted (from useSortable)
		if (active.data?.current?.type === 'block') {
			// This is a block being sorted - don't set activeItem for drag overlay
			setActiveItem(null);
			return;
		}

		// This is a template card being dragged from sidebar (from useDraggable)
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

		// Handle dropping library templates directly as sections
		if (active.data?.current?.type === 'library-template') {
			const template = active.data.current.template;
			console.log('Library template detected:', template);

			// Check if this is a drop on the canvas or canvas-blocks
			const overData = over.data?.current;
			if (
				over.id === 'canvas' ||
				over.id === 'canvas-blocks' ||
				overData?.acceptes?.includes('library-template')
			) {
				console.log('Creating new section for library template');

				// Create a new section with this template
				const newSection = {
					id: uuidv4(),
					columns: [
						{
							id: uuidv4(),
							width: 1,
							blocks: [],
						},
					],
					styles: {
						backgroundColor: '#fff',
						padding: '20px',
					},
				};

				// Add the section
				dispatch(STORE_KEY).addSection(newSection);

				// Get the section and column IDs
				const sectionId = newSection.id;
				const columnId = newSection.columns[0].id;

				// Add blocks from template to this section
				if (template.blocks && Array.isArray(template.blocks)) {
					console.log(
						'Creating multiple blocks from template:',
						template.blocks
					);

					// Add each block from the template
					template.blocks.forEach((blockConfig) => {
						// Add template layout information to the block props
						const blockProps = {
							...blockConfig.props,
							templateLayout:
								template.layout?.[
									blockConfig.props.containerId
								] || null,
						};

						addNewBlockWithProps(
							sectionId,
							columnId,
							blockConfig.type,
							blockProps
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for template:',
						template
					);
					addNewBlockWithProps(
						sectionId,
						columnId,
						template.type,
						template.props || {}
					);
				}
				return;
			} else {
				// Should never get here since collision detection restricts drops
				console.log(
					'Library template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle dropping header templates directly as sections
		if (active.data?.current?.type === 'header-template') {
			const template = active.data.current.template;
			console.log('Header template detected:', template);

			// Check if this is a drop on the canvas or canvas-blocks
			const overData = over.data?.current;
			if (
				over.id === 'canvas' ||
				over.id === 'canvas-blocks' ||
				overData?.acceptes?.includes('library-template')
			) {
				console.log('Creating new section for header template');

				// Create a new section with this template
				const newSection = {
					id: uuidv4(),
					columns: [
						{
							id: uuidv4(),
							width: 1,
							blocks: [],
						},
					],
					styles: {
						backgroundColor: '#fff',
						padding: '20px',
					},
				};

				// Add the section
				dispatch(STORE_KEY).addSection(newSection);

				// Get the section and column IDs
				const sectionId = newSection.id;
				const columnId = newSection.columns[0].id;

				// Add blocks based on template type
				if (template.type === 'logo-button' && template.layout) {
					// For logo+button template, create a special container with flex justify-between
					console.log(
						'Creating logo+button layout with flex justify-between'
					);

					// Create a special container block that will hold both logo and button inline
					const containerBlockId = `container-${Date.now()}`;

					// Add the logo block first with special inline properties
					addNewBlockWithProps(
						sectionId,
						columnId,
						template.blocks[0].type,
						{
							...template.blocks[0].props,
							width: 'auto', // Logo gets auto width like other options
							align: 'left',
							// Add a special property to identify this as part of inline layout
							inlineLayout: true,
							containerId: containerBlockId,
							// Pass the template layout information to the block
							templateLayout: template.layout,
						}
					);

					// Add the button block second with special inline properties
					addNewBlockWithProps(
						sectionId,
						columnId,
						template.blocks[1].type,
						{
							...template.blocks[1].props,
							width: '50%',
							align: 'right',
							// Add a special property to identify this as part of inline layout
							inlineLayout: true,
							containerId: containerBlockId,
							// Pass the template layout information to the block
							templateLayout: template.layout,
						}
					);
				} else {
					// For other templates, add blocks normally
					template.blocks.forEach((block, index) => {
						console.log(
							`Adding block ${index + 1} to column:`,
							block
						);
						addNewBlockWithProps(
							sectionId,
							columnId,
							block.type,
							block.props
						);
					});
				}
				return;
			} else {
				// Should never get here since collision detection restricts drops
				console.log(
					'Header template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle dropping email body templates directly as sections
		if (active.data?.current?.type === 'email-body-template') {
			const template = active.data.current.template;
			console.log('Email body template detected:', template);

			// Check if this is a drop on the canvas or canvas-blocks
			const overData = over.data?.current;
			if (
				over.id === 'canvas' ||
				over.id === 'canvas-blocks' ||
				overData?.acceptes?.includes('library-template')
			) {
				console.log('Creating new section for email body template');

				// Create a new section with this template
				const newSection = {
					id: uuidv4(),
					columns: [
						{
							id: uuidv4(),
							width: 1,
							blocks: [],
						},
					],
					styles: {
						backgroundColor: '#fff',
						padding: '20px',
					},
				};

				// Add the section
				dispatch(STORE_KEY).addSection(newSection);

				// Get the section and column IDs
				const sectionId = newSection.id;
				const columnId = newSection.columns[0].id;

				// Check if this is an email body template with multiple blocks
				if (template.blocks && Array.isArray(template.blocks)) {
					console.log(
						'Creating multiple blocks from email body template:',
						template.blocks
					);

					// Add each block from the template
					template.blocks.forEach((blockConfig) => {
						// Add template layout information to the block props
						const blockProps = {
							...blockConfig.props,
							templateLayout:
								template.layout?.[
									blockConfig.props.containerId
								] || null,
						};

						addNewBlockWithProps(
							sectionId,
							columnId,
							blockConfig.type,
							blockProps
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for email body template:',
						template
					);
					addNewBlockWithProps(
						sectionId,
						columnId,
						template.type,
						template.props || {}
					);
				}
				return;
			} else {
				// Should never get here since collision detection restricts drops
				console.log(
					'Email body template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle dropping footer templates directly as sections
		if (active.data?.current?.type === 'footer-template') {
			const template = active.data.current.template;
			console.log('Footer template detected:', template);

			// Check if this is a drop on the canvas or canvas-blocks
			const overData = over.data?.current;
			if (
				over.id === 'canvas' ||
				over.id === 'canvas-blocks' ||
				overData?.acceptes?.includes('library-template')
			) {
				console.log('Creating new section for footer template');

				// Create a new section with this template
				const newSection = {
					id: uuidv4(),
					columns: [
						{
							id: uuidv4(),
							width: 1,
							blocks: [],
						},
					],
					styles: {
						backgroundColor: '#fff',
						padding: '20px',
					},
				};

				// Add the section
				dispatch(STORE_KEY).addSection(newSection);

				// Get the section and column IDs
				const sectionId = newSection.id;
				const columnId = newSection.columns[0].id;

				// Check if this is a footer template with multiple blocks
				if (template.blocks && Array.isArray(template.blocks)) {
					console.log(
						'Creating multiple blocks from footer template:',
						template.blocks
					);

					// Add each block from the template
					template.blocks.forEach((blockConfig) => {
						// Add template layout information to the block props
						const blockProps = {
							...blockConfig.props,
							templateLayout:
								template.layout?.[
									blockConfig.props.containerId
								] || null,
						};

						addNewBlockWithProps(
							sectionId,
							columnId,
							blockConfig.type,
							blockProps
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for footer template:',
						template
					);
					addNewBlockWithProps(
						sectionId,
						columnId,
						template.type,
						template.props || {}
					);
				}
				return;
			} else {
				// Should never get here since collision detection restricts drops
				console.log(
					'Footer template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle dropping image gallery templates directly as sections
		if (active.data?.current?.type === 'image-gallery-template') {
			const template = active.data.current.template;
			console.log('Image gallery template detected:', template);

			// Check if this is a drop on the canvas or canvas-blocks
			const overData = over.data?.current;
			if (
				over.id === 'canvas' ||
				over.id === 'canvas-blocks' ||
				overData?.acceptes?.includes('library-template')
			) {
				console.log('Creating new section for image gallery template');

				// Create a new section with this template
				const newSection = {
					id: uuidv4(),
					columns: [
						{
							id: uuidv4(),
							width: 1,
							blocks: [],
						},
					],
					styles: {
						backgroundColor: '#fff',
						padding: '20px',
					},
				};

				// Add the section
				dispatch(STORE_KEY).addSection(newSection);

				// Get the section and column IDs
				const sectionId = newSection.id;
				const columnId = newSection.columns[0].id;

				// Check if this is an image gallery template with multiple blocks
				if (template.blocks && Array.isArray(template.blocks)) {
					console.log(
						'Creating multiple blocks from image gallery template:',
						template.blocks
					);

					// Add each block from the template
					template.blocks.forEach((blockConfig) => {
						// Add template layout information to the block props
						const blockProps = {
							...blockConfig.props,
							templateLayout:
								template.layout?.[
									blockConfig.props.containerId
								] || null,
						};

						addNewBlockWithProps(
							sectionId,
							columnId,
							blockConfig.type,
							blockProps
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for image gallery template:',
						template
					);
					addNewBlockWithProps(
						sectionId,
						columnId,
						'image',
						template.props || {}
					);
				}
				return;
			} else {
				// Should never get here since collision detection restricts drops
				console.log(
					'Image gallery template dropped on invalid area - ignoring'
				);
				return;
			}
		}

		// Handle section reordering (when dragging sections to reorder them)
		if (
			active.data?.current?.type === 'section' &&
			over.data?.current?.type === 'section'
		) {
			// This is section reordering
			const activeSectionId = active.data.current.sectionId;
			const overSectionId = over.data.current.sectionId;
			reorderSections(activeSectionId, overSectionId);
			return;
		}

		// Handle block reordering (when dragging blocks between columns)
		if (active.data?.current?.type === 'block') {
			const activeData = active.data.current;
			const overData = over.data?.current;

			// Moving block to a different column
			if (overData?.type === 'column') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				// Only move if it's actually moving to a different column
				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId
				) {
					moveBlock(
						blockId,
						fromSectionId,
						fromColumnId,
						toSectionId,
						toColumnId,
						0
					);
				}
				return;
			}

			// Moving block within the same column or to a different position
			if (overData?.type === 'block') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				// For block-to-block drops, we'll put the block right after the target block
				const toIndex = 1; // Put after the target block

				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId ||
					active.id !== over.id
				) {
					moveBlock(
						blockId,
						fromSectionId,
						fromColumnId,
						toSectionId,
						toColumnId,
						toIndex
					);
				}
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
						Preheader Template
					</div>
				</div>
			);
		}

		// Handle header template overlay
		if (activeItem.type === 'header-template') {
			const template = activeItem.template;
			let title = '';

			switch (template.type) {
				case 'single-logo':
					title = 'Logo';
					break;
				case 'logo-navigation':
					title = 'Logo + Navigation';
					break;
				case 'logo-button':
					title = 'Logo + Button';
					break;
				default:
					title = 'Header Template';
			}

			return (
				<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
					<div className="text-sm font-medium text-gray-700">
						{title}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Header Template
					</div>
				</div>
			);
		}

		// Handle email body template overlay
		if (activeItem.type === 'email-body-template') {
			const template = activeItem.template;
			let title = '';

			switch (template.type) {
				case 'title-1':
					title = 'Title 1';
					break;
				case 'title-2':
					title = 'Title 2';
					break;
				case 'title-3':
					title = 'Title 3';
					break;
				case 'title-4':
					title = 'Title 4';
					break;
				case 'title-button-1':
					title = 'Title & Button 1';
					break;
				case 'title-button-2':
					title = 'Title & Button 2';
					break;
				case 'title-button-5':
					title = 'Title & Button 5';
					break;
				case 'title-paragraph-button':
					title = 'Title, Paragraph & Button';
					break;
				default:
					title = 'Email Body Template';
			}

			return (
				<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
					<div className="text-sm font-medium text-gray-700">
						{title}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Email Body Template
					</div>
				</div>
			);
		}

		// Handle footer template overlay
		if (activeItem.type === 'footer-template') {
			const template = activeItem.template;
			let title = '';

			switch (template.type) {
				case 'centered-footer':
					title = 'Centered Footer';
					break;
				case 'centered-footer-items':
					title = 'Centered Footer & Items';
					break;
				case 'basic-footer':
					title = 'Basic Footer';
					break;
				default:
					title = 'Footer Template';
			}

			return (
				<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
					<div className="text-sm font-medium text-gray-700">
						{title}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Footer Template
					</div>
				</div>
			);
		}

		// Handle image gallery template overlay
		if (activeItem.type === 'image-gallery-template') {
			const template = activeItem.template;
			let title = '';

			switch (template.type) {
				case 'grid-1':
					title = 'Grid 1';
					break;
				case 'grid-2':
					title = 'Grid 2';
					break;
				case 'grid-3':
					title = 'Grid 3';
					break;
				case 'grid-4':
					title = 'Grid 4';
					break;
				case 'grid-5':
					title = 'Grid 5';
					break;
				case 'grid-6':
					title = 'Grid 6';
					break;
				default:
					title = 'Image Gallery';
			}

			return (
				<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
					<div className="text-sm font-medium text-gray-700">
						{title}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						Image Gallery Template
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
					collisionDetection={customCollisionDetection}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[snapCenterToCursor]}
				>
					<Sidebar />
					<Canvas />

					<DragOverlay>
						{renderDragOverlay()}
						{/* {activeItem && activeItem.item ? (
							<div className="opacity-90 transform rotate-3 shadow-lg">
								<TemplateCard
									item={activeItem.item}
									type={activeItem.type}
									blockType={activeItem.blockType}
									isDragOverlay={true}
								/>
							</div>
						) : null} */}
					</DragOverlay>
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
