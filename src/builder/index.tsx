/**
 * external dependencies
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
	DndContext,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
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
import DragOverlayRenderer from './components/DragOverlayRenderer';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../stores/email-builder/constants';
import { useButtonSettings } from './hooks/useButtonSettings';
import { useCollisionDetection } from './hooks/useCollisionDetection';
import { useDragHandlers } from './hooks/useDragHandlers';

const BuilderContent: React.FC = () => {
	const dispatch = useDispatch();
	const [sidebarCloseTrigger, setSidebarCloseTrigger] = useState(0);

	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);

	useButtonSettings();

	const customCollisionDetection = useCollisionDetection();

	const onDragEndCallback = useCallback(() => {
		// Trigger sidebar close after drop
		setSidebarCloseTrigger((prev) => prev + 1);
	}, []);

	const { activeItem, handleDragStart, handleDragEnd } =
		useDragHandlers(onDragEndCallback);

	useEffect(() => {
		const loadTemplateData = async () => {
			if (!existingTemplateData?.template_id) {
				return;
			}

			try {
				const { getTemplate } = await import('./api/templates');
				const template = await getTemplate(
					existingTemplateData.template_id
				);
				const emailBody = template.email_body;

				if (emailBody?.type === 'builder' && emailBody.value) {
					const { sections, globalSettings, buttonSettings } =
						emailBody.value;

					// Load sections
					if (sections && sections.length > 0) {
						dispatch(STORE_KEY).setBuilderState(sections);
					}

					// Load global settings
					if (globalSettings) {
						dispatch(STORE_KEY).updateGlobalSettings(
							globalSettings
						);
					}

					// Load button settings if they exist
					if (buttonSettings) {
						// Update each button type's settings
						Object.entries(buttonSettings).forEach(
							([buttonType, settings]) => {
								dispatch(STORE_KEY).updateButtonSettings(
									buttonType,
									settings
								);
							}
						);
					}
				}
			} catch (error) {
				console.error('Failed to load template:', error);
			}
		};

		loadTemplateData();
	}, [existingTemplateData?.template_id, dispatch]);

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

	// Custom drop animation to make items disappear after drop (no return animation)
	const dropAnimation = {
		duration: 0, // Instant disappear, no animation back to original position
		easing: 'ease',
	};

	return (
		<div
			className="flex flex-col fixed inset-0 bg-primary-foreground overflow-hidden"
			style={{
				zIndex: 99999,
				width: '100vw',
				height: '100vh',
			}}
		>
			<Header />
			<div
				className="flex flex-1 overflow-hidden"
				style={{ backgroundColor: '#e6eff7' }}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={customCollisionDetection}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[snapCenterToCursor]}
				>
					<Sidebar sidebarCloseTrigger={sidebarCloseTrigger} />
					<Canvas />

					<DragOverlay dropAnimation={dropAnimation}>
						<DragOverlayRenderer activeItem={activeItem} />
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
