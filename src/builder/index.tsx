/**
 * external dependencies
 */
import React, { useEffect } from 'react';
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

	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);

	useButtonSettings();

	const customCollisionDetection = useCollisionDetection();
	const { activeItem, handleDragStart, handleDragEnd } = useDragHandlers();

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
					const { sections, globalSettings } = emailBody.value;

					if (sections && sections.length > 0) {
						dispatch(STORE_KEY).setBuilderState(sections);
					}

					if (globalSettings) {
						dispatch(STORE_KEY).updateGlobalSettings(
							globalSettings
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
