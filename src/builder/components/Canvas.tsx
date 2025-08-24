import { useState } from 'react';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { STORE_KEY } from '../../stores/email-builder/constants';
import SectionRenderer from './SectionRenderer';
import { Button } from '@/components/ui/button';
import AddNewSectionModal from './AddNewSectionModal';
//@ts-ignore
import emailBuilder from '../../../assets/images/email-builder.png';
import { ColumnsLayout } from '@quillcrm/components';
import { LayoutTemplate } from '../types';
import { useDroppable } from '@dnd-kit/core';
import { useBuilder } from '../context/BuilderContext';

const Canvas = () => {
	const { addNewSection } = useBuilder();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { isOver: isOverCanvas, setNodeRef: setNodeRefCanvas } = useDroppable(
		{
			id: 'canvas',
			data: {
				acceptes: ['template'],
			},
		}
	);
	const { isOver, setNodeRef } = useDroppable({
		id: 'canvas-blocks',
	});
	const style = {
		color: isOver ? 'green' : undefined,
	};

	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);

	const handleOpenModal = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleSectionSelect = (sectionType: LayoutTemplate) => {
		addNewSection(sectionType);
		setIsModalOpen(false);
	};

	return (
		<div className="flex-1 p-4 pt-20 overflow-auto">
			<div className="max-w-3xl mx-auto relative">
				{sections.length > 0 && (
					<div className="p-2 bg-primary w-fit rounded-t-xl absolute -top-9 left-0 text-white">
						{__('Email Page', 'quillcrm')}
					</div>
				)}
				{/* Email Template Container */}
				<div
					ref={setNodeRefCanvas}
					style={{
						backgroundColor: isOverCanvas ? 'red' : undefined,
					}}
					className="bg-white shadow-lg rounded-lg overflow-hidden"
				>
					<SortableContext
						items={sections.map((s) => s.id)}
						strategy={verticalListSortingStrategy}
					>
						{sections.length === 0 ? (
							<div
								ref={setNodeRef}
								className="text-center py-16 px-8"
								style={style}
							>
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
