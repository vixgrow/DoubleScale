/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
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
import {
	handleTemplateDropOnCanvas,
	isTemplateSection,
	TemplateType,
	TemplateConfig,
} from './utils/dragAndDropHelpers';

const BuilderContent: React.FC = () => {
	const dispatch = useDispatch();
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);

	// Get existing template data from campaign store
	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);

	// Initialize button settings (loads from campaign template data)
	useButtonSettings();

	// Load existing builder data from template's email_body field
	useEffect(() => {
		const emailBody = existingTemplateData?.template?.email_body;

		if (emailBody?.type === 'builder' && emailBody.value) {
			const { sections, globalSettings } = emailBody.value;

			// Load sections if available
			if (sections && sections.length > 0) {
				dispatch(STORE_KEY).setBuilderState(sections);
			}

			// Load global settings if available
			if (globalSettings) {
				dispatch(STORE_KEY).updateGlobalSettings(globalSettings);
			}

			// Button settings are loaded by useButtonSettings hook
		}
	}, [existingTemplateData, dispatch]);

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
		setActiveItem(null);

		if (!over || active.id === over.id) {
			return;
		}

		// Handle all template types with unified logic
		const templateTypes: TemplateType[] = [
			'library-template',
			'header-template',
			'email-body-template',
			'footer-template',
			'image-gallery-template',
		];

		const activeType = active.data?.current?.type as TemplateType;
		if (templateTypes.includes(activeType) && active.data?.current) {
			const template = active.data.current.template as TemplateConfig;
			const overData = over.data?.current;

			const handled = handleTemplateDropOnCanvas(
				template,
				over.id,
				overData,
				(section) => dispatch(STORE_KEY).addSection(section),
				(sectionId, columnId, block) =>
					dispatch(STORE_KEY).addBlock(sectionId, columnId, block)
			);

			if (handled) {
				return;
			}
			return;
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

			// Moving block to a different column
			if (overData?.type === 'column') {
				const { sectionId: toSectionId, columnId: toColumnId } =
					overData;
				const {
					blockId,
					sectionId: fromSectionId,
					columnId: fromColumnId,
				} = activeData;

				// Check if the target section is a template section
				const targetSection = sections.find(
					(s) => s.id === toSectionId
				);
				if (targetSection && isTemplateSection(targetSection)) {
					return;
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

			// If no valid drop target found
			if (!overData) {
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

				// Get the target block index
				const targetSection = sections.find(
					(s) => s.id === toSectionId
				);
				const targetColumn = targetSection?.columns.find(
					(c) => c.id === toColumnId
				);
				const targetBlockIndex =
					targetColumn?.blocks.findIndex((b) => b.id === over.id) ||
					0;

				// Calculate the correct index for insertion
				let toIndex = targetBlockIndex;

				// If moving within the same column, adjust the index
				if (
					fromSectionId === toSectionId &&
					fromColumnId === toColumnId
				) {
					// Place block at target position
					toIndex = targetBlockIndex;
				} else {
					// Moving to different column, insert after target
					toIndex = targetBlockIndex + 1;
				}

				// Only move if it's actually a different position
				if (
					fromSectionId !== toSectionId ||
					fromColumnId !== toColumnId ||
					active.id !== over.id
				) {
					try {
						dispatch(STORE_KEY).moveBlock(
							blockId,
							fromSectionId,
							fromColumnId,
							toSectionId,
							toColumnId,
							toIndex
						);
					} catch (error) {
						console.error('Error executing moveBlock:', error);
					}
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
				const targetSection = sections.find((s) => s.id === sectionId);
				if (targetSection && isTemplateSection(targetSection)) {
					return;
				}

				const blockDef = blocksRegistry[blockType];
				if (blockDef) {
					dispatch(STORE_KEY).addBlock(sectionId, columnId, {
						id: uuidv4(),
						type: blockType,
						props: { ...blockDef.defaultProps },
					});
				}
				return;
			}
		}

		// Handle dropping new layouts (sections) from sidebar
		if (active.data?.current?.type === 'layout') {
			const layoutItem = active.data.current.item;

			const newSection = {
				id: uuidv4(),
				columns: layoutItem.width.map((width: number) => ({
					id: uuidv4(),
					width, // Now using actual percentages directly
					blocks: [],
				})),
				styles: {},
			};
			dispatch(STORE_KEY).addSection(newSection);
		}
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
