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
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../stores/email-builder/constants';
import { v4 as uuidv4 } from 'uuid';
import { blocksRegistry } from './blocks/BlockRegister';
import { useButtonSettings } from './hooks/useButtonSettings';

// Utility function to add template layout to block props
const addTemplateLayoutToBlockProps = (blockConfig, template) => {
	return {
		...blockConfig.props,
		templateLayout:
			template.layout?.[blockConfig.props.containerId] || null,
		// Add a marker to identify this as a template block
		templateType: template.type || 'library-template',
	};
};

const BuilderContent: React.FC = () => {
	const dispatch = useDispatch();
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	
	// Initialize button settings (loads from API on mount)
	useButtonSettings();
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

		// If we're dragging a block, consider both columns and other blocks for collision
		if (active.data?.current?.type === 'block') {
			const columnContainers = Array.from(
				droppableContainers.values()
			).filter((container) => container.data?.current?.type === 'column');

			const blockContainers = Array.from(
				droppableContainers.values()
			).filter((container) => container.data?.current?.type === 'block');

			// Combine column and block containers for collision detection
			const allContainers = [...columnContainers, ...blockContainers];

			// Use pointerWithin for more precise positioning when dragging blocks
			return pointerWithin({
				...args,
				droppableContainers: allContainers,
			});
		}

		// If we're dragging an element, only consider columns for collision
		if (active.data?.current?.type === 'element') {
			const columnContainers = Array.from(
				droppableContainers.values()
			).filter((container) => container.data?.current?.type === 'column');

			// Use closestCenter for element-to-column collision detection
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
			// This is a block being sorted - set activeItem for drag overlay
			setActiveItem(active.data.current);
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
							width: 100,
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
						const blockProps = addTemplateLayoutToBlockProps(
							blockConfig,
							template
						);

						dispatch(STORE_KEY).addBlock(
							sectionId,
							columnId,
							{
								id: uuidv4(),
								type: blockConfig.type,
								props: blockProps,
							}
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for template:',
						template
					);
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: template.type,
							props: template.props || {},
						}
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
							width: 100,
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
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: template.blocks[0].type,
							props: {
								...template.blocks[0].props,
								width: 'auto',
								align: 'left',
								inlineLayout: true,
								containerId: containerBlockId,
								templateLayout: template.layout,
							},
						}
					);

					// Add the button block second with special inline properties
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: template.blocks[1].type,
							props: {
								...template.blocks[1].props,
								width: '50%',
								align: 'right',
								inlineLayout: true,
								containerId: containerBlockId,
								templateLayout: template.layout,
							},
						}
					);
				} else {
					// For other templates, add blocks normally
					template.blocks.forEach((block, index) => {
						console.log(
							`Adding block ${index + 1} to column:`,
							block
						);
						dispatch(STORE_KEY).addBlock(
							sectionId,
							columnId,
							{
								id: uuidv4(),
								type: block.type,
								props: block.props,
							}
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
							width: 100,
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
						const blockProps = addTemplateLayoutToBlockProps(
							blockConfig,
							template
						);

						dispatch(STORE_KEY).addBlock(
							sectionId,
							columnId,
							{
								id: uuidv4(),
								type: blockConfig.type,
								props: blockProps,
							}
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for email body template:',
						template
					);
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: template.type,
							props: template.props || {},
						}
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
							width: 100,
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
						const blockProps = addTemplateLayoutToBlockProps(
							blockConfig,
							template
						);

						dispatch(STORE_KEY).addBlock(
							sectionId,
							columnId,
							{
								id: uuidv4(),
								type: blockConfig.type,
								props: blockProps,
							}
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for footer template:',
						template
					);
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: template.type,
							props: template.props || {},
						}
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
							width: 100,
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
						const blockProps = addTemplateLayoutToBlockProps(
							blockConfig,
							template
						);

						dispatch(STORE_KEY).addBlock(
							sectionId,
							columnId,
							{
								id: uuidv4(),
								type: blockConfig.type,
								props: blockProps,
							}
						);
					});
				} else {
					// Fallback: Add the template as a single block
					console.log(
						'Creating single block for image gallery template:',
						template
					);
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: 'image',
							props: template.props || {},
						}
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
			dispatch(STORE_KEY).reorderSections(activeSectionId, overSectionId);
			return;
		}

		// Handle block reordering (when dragging blocks between columns or within same column)
		if (active.data?.current?.type === 'block') {
			const activeData = active.data.current;
			const overData = over.data?.current;

			console.log('Block drag end - Active data:', activeData);
			console.log('Block drag end - Over data:', overData);

			// Moving block to a different column
			if (overData?.type === 'column') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				console.log('Moving block to column:', {
					fromSectionId,
					fromColumnId,
					toSectionId,
					toColumnId
				});

				// Check if the target section is a template section
				const targetSection = sections.find(s => s.id === toSectionId);
				if (targetSection) {
					const hasTemplateLayout = targetSection.columns.some(column =>
						column.blocks.some(block =>
							block.props?.templateLayout !== undefined
						)
					);
					const hasTemplatePattern = targetSection.columns.some(column =>
						column.blocks.some(block => {
							if (block.type === 'image' && block.props?.alt === 'Company Logo') return true;
							if (block.type === 'preheader') return true;
							if (block.props?.templateType) return true;
							if (block.type === 'text' && block.props?.content?.includes('©')) return true;
							if (block.type === 'text' && block.props?.content?.includes('Welcome')) return true;
							return false;
						})
					);

					if (hasTemplateLayout || hasTemplatePattern) {
						console.log('Cannot drop block on template section - section is locked');
						return;
					}
				}

				// Only move if it's actually moving to a different column
				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId
				) {
					dispatch(STORE_KEY).moveBlock(
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

			// If no valid drop target found, try to find the closest column
			if (!overData) {
				console.log('No valid drop target found, attempting to find closest column');
				// This is a fallback - in most cases this shouldn't happen
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

				console.log('Block-to-block reordering:', {
					fromSectionId,
					fromColumnId,
					toSectionId,
					toColumnId,
					blockId,
					targetBlockId: over.id
				});

				// Get the target block index
				const targetSection = sections.find(s => s.id === toSectionId);
				const targetColumn = targetSection?.columns.find(c => c.id === toColumnId);
				const targetBlockIndex = targetColumn?.blocks.findIndex(b => b.id === over.id) || 0;

				// Calculate the correct index for insertion
				let toIndex = targetBlockIndex;

				// If moving within the same column, we need to adjust the index
				if (fromSectionId === toSectionId && fromColumnId === toColumnId) {
					const fromBlockIndex = targetColumn?.blocks.findIndex(b => b.id === blockId) || 0;

					console.log('Same column reordering debug:', {
						fromBlockIndex,
						targetBlockIndex,
						blockId,
						targetBlockId: over.id,
						direction: fromBlockIndex < targetBlockIndex ? 'down' : 'up',
						calculatedIndex: targetBlockIndex
					});

					// For same-column reordering, let's try a simpler approach
					// Just place the block at the target position
					toIndex = targetBlockIndex;
				} else {
					// Moving to different column, insert after target
					console.log('Cross-column reordering - inserting after target');
					toIndex = targetBlockIndex + 1;
				}

				console.log('Final insertion index:', toIndex);

				// Only move if it's actually a different position
				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId ||
					active.id !== over.id
				) {
					console.log('Executing moveBlock with index:', toIndex);
					console.log('Move details:', {
						blockId,
						fromSectionId,
						fromColumnId,
						toSectionId,
						toColumnId,
						toIndex,
						targetBlockIndex
					});

					try {
						dispatch(STORE_KEY).moveBlock(
							blockId,
							fromSectionId,
							fromColumnId,
							toSectionId,
							toColumnId,
							toIndex
						);
						console.log('moveBlock executed successfully');
					} catch (error) {
						console.error('Error executing moveBlock:', error);
					}
				} else {
					console.log('No move needed - same position');
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

				// Check if the target section is a template section
				const targetSection = sections.find(s => s.id === sectionId);
				if (targetSection) {
					const hasTemplateLayout = targetSection.columns.some(column =>
						column.blocks.some(block =>
							block.props?.templateLayout !== undefined
						)
					);
					const hasTemplatePattern = targetSection.columns.some(column =>
						column.blocks.some(block => {
							if (block.type === 'image' && block.props?.alt === 'Company Logo') return true;
							if (block.type === 'preheader') return true;
							if (block.props?.templateType) return true;
							if (block.type === 'text' && block.props?.content?.includes('©')) return true;
							if (block.type === 'text' && block.props?.content?.includes('Welcome')) return true;
							return false;
						})
					);

					if (hasTemplateLayout || hasTemplatePattern) {
						console.log('Cannot drop new block on template section - section is locked');
						return;
					}
				}

				const blockDef = blocksRegistry[blockType];
				if (blockDef) {
					dispatch(STORE_KEY).addBlock(
						sectionId,
						columnId,
						{
							id: uuidv4(),
							type: blockType,
							props: { ...blockDef.defaultProps },
						}
					);
				}
				return;
			}
		}

		// Handle dropping new sections
		if (active.data?.current?.type === 'layout') {
			const layoutItem = active.data.current.item;
			const newSection = {
				id: uuidv4(),
				columns: layoutItem.number.map(() => ({
					id: uuidv4(),
					width: 100 / layoutItem.number.length,
					blocks: [],
				})),
				styles: {},
			};
			dispatch(STORE_KEY).addSection(newSection);
		}

		console.log('Drag ended:', { active: active.id, over: over.id });
	};

	const renderDragOverlay = () => {
		if (!activeItem) return null;

		// Handle block overlay
		if (activeItem.type === 'block') {
			const block = activeItem.block;
			const blockDefinition = blocksRegistry[block.type];

			return (
				<div className="opacity-90 transform rotate-3 shadow-lg w-48">
					<TemplateCard
						item={blockDefinition}
						type="element"
						blockType={block.type}
						isDragOverlay={true}
					/>
				</div>
			);
		}

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
				case 'title-2-buttons':
					title = 'Title & 2 Buttons';
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
	return <BuilderContent />;
};

export default Builder;
