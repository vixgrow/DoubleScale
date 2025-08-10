import { useState } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
	DragOverlay,
} from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailSection } from '../../stores/email-builder/types';
import SectionRenderer from './SectionRenderer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { blocksRegistry } from '../blocks/BlockRegister';
import AddNewSectionModal from './AddNewSectionModal';
//@ts-ignore
import emailBuilder from '../../../assets/images/email-builder.png';
import { ColumnsLayout } from '@quillcrm/components';

const Canvas = () => {
	const dispatch = useDispatch();
	const sensors = useSensors(useSensor(PointerSensor));
	const [isModalOpen, setIsModalOpen] = useState(false);

	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);

	const handleDragEnd = (event: any) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		// Handle dropping new blocks from sidebar
		if (active.data?.current?.type === 'template') {
			const { blockType } = active.data.current;
			const overData = over.data?.current;

			if (overData?.type === 'column') {
				const { sectionId, columnId } = overData;

				// Create new block
				const newBlock = {
					id: uuidv4(),
					type: blockType,
					props: blocksRegistry[blockType]?.defaultProps || {},
				};

				dispatch(STORE_KEY).addBlock(sectionId, columnId, newBlock);
				return;
			}
		}

		// Handle block reordering within canvas
		// This is a simplified version - you might want to implement more complex logic
		console.log('Drag ended:', { active: active.id, over: over.id });
	};

	const addNewSection = () => {
		const newSection: EmailSection = {
			id: uuidv4(),
			columns: [
				{
					id: uuidv4(),
					width: 100,
					blocks: [],
				},
			],
			styles: {
				backgroundColor: '#ffffff',
				padding: '20px',
			},
		};

		dispatch(STORE_KEY).addSection(newSection);
	};

	const handleOpenModal = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleSectionSelect = () => {
		addNewSection();
		setIsModalOpen(false);
	};

	return (
		<div className="flex-1 p-4 overflow-auto">
			<div className="max-w-3xl mx-auto">
				{/* Email Template Container */}
				<div className="bg-white shadow-lg rounded-lg overflow-hidden">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={sections.map((s) => s.id)}
							strategy={verticalListSortingStrategy}
						>
							{sections.length === 0 ? (
								<div className="text-center py-16 px-8">
									<div className="text-muted-foreground mb-4">
										<div className="size-full mx-auto mb-4 flex items-center justify-center">
											<img
												src={emailBuilder}
												alt="email-builder.png"
											/>
										</div>
										<p className="text-2xl text-secondary-foreground font-medium leading-10 text-center">
											{__(
												'There are no sections at the moment. Start adding',
												'quillcrm'
											)}
											<br />
											{__(
												'sections and controlling elements.',
												'quillcrm'
											)}
										</p>
									</div>
									<Button
										onClick={handleOpenModal}
										variant="gradient"
										size="lg"
										className="px-5"
									>
										<ColumnsLayout />
										{__('Add New Section', 'quillcrm')}
									</Button>
								</div>
							) : (
								<>
									{sections.map((section) => (
										<SectionRenderer
											key={section.id}
											section={section}
										/>
									))}

									{/* Add Section Button */}
									<div className="p-4 border-t border-dashed border-border">
										<Button
											variant="outline"
											className="w-full shadow-none border-dashed border-primary text-primary bg-transparent"
											onClick={handleOpenModal}
										>
											{__('Add New Section', 'quillcrm')}
										</Button>
									</div>
								</>
							)}
						</SortableContext>

						<DragOverlay>
							{/* Render dragged item here */}
						</DragOverlay>
					</DndContext>
				</div>
			</div>

			{/* Add New Section Modal */}
			<AddNewSectionModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSectionSelect={handleSectionSelect}
			/>
		</div>
	);
};

export default Canvas;
