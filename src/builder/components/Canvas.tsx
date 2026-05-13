import React, { useState } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
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
import { ColumnsLayout } from '@doublescale/components';
import { LayoutTemplate } from '../types';
import { useDroppable } from '@dnd-kit/core';
import { EmailBuilderService } from '@/builder/services/EmailBuilderService';
import { SectionDropZone } from './SectionDropZone';
import CanvasShimmer from './CanvasShimmer';

const Canvas = () => {
	const dispatch = useDispatch();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { isOver: isOverCanvas, setNodeRef: setNodeRefCanvas } = useDroppable(
		{
			id: 'canvas',
			data: {
				acceptes: ['template', 'library-template'],
			},
		}
	);
	const { isOver, setNodeRef } = useDroppable({
		id: 'canvas-blocks',
		data: {
			acceptes: ['template', 'library-template'],
		},
	});

	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);
	const isLoading = useSelect(
		(select) => select(STORE_KEY).getIsLoading(),
		[]
	);

	const handleOpenModal = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleSectionSelect = (sectionType: LayoutTemplate) => {
		const newSection = EmailBuilderService.createSection(sectionType);
		dispatch(STORE_KEY).addSection(newSection);
		setIsModalOpen(false);
	};

	return (
		<div className="flex-1 overflow-auto h-full">
			<style>{`
				/* Disable pointer events on links and buttons in canvas content only */
				#doublescale-email-builder [data-block-id] a,
				#doublescale-email-builder [data-block-id] button {
					pointer-events: none !important;
					cursor: default !important;
				}
			`}</style>
			<div
				className="mx-auto relative py-10"
				style={{ width: `${globalSettings.canvasWidth}px` }}
			>
				{(sections.length > 0 || isLoading) && (
					<div className="p-2 bg-primary w-fit rounded-t-xl absolute -top-9 left-0 text-white">
						{__('Email Page', 'doublescale')}
					</div>
				)}
				{/* Email Template Container */}
				<div
					ref={setNodeRefCanvas}
					style={{
						backgroundColor: globalSettings.canvasColor,
						backgroundImage: globalSettings.backgroundImage
							? `url(${globalSettings.backgroundImage.url})`
							: undefined,
						backgroundRepeat: globalSettings.backgroundRepeat,
						backgroundSize: globalSettings.backgroundSize,
						backgroundPosition:
							globalSettings.backgroundPosition || 'center',
					}}
					className={`shadow-lg rounded-lg ${
						isOverCanvas
							? 'border-2 border-dashed border-[#336cd3]'
							: ''
					}`}
				>
					<SortableContext
						items={sections.map((s) => s.id)}
						strategy={verticalListSortingStrategy}
					>
						{isLoading ? (
							<CanvasShimmer />
						) : sections.length === 0 ? (
							<div
								ref={setNodeRef}
								className="text-center py-16 px-8 relative"
							>
								{/* Drop indicator for empty canvas */}
								{isOver && (
									<div className="absolute inset-0 border-4 border-dashed border-blue-500 bg-blue-50/20 rounded-lg flex items-center justify-center">
										<div className="text-blue-600 font-semibold text-lg">
											{__(
												'Drop here to add section',
												'doublescale'
											)}
										</div>
									</div>
								)}

								<div className="text-muted-foreground mb-4">
									<div className="size-80 mx-auto mb-4 flex items-center justify-center">
										<img
											src={emailBuilder}
											alt="email-builder.png"
										/>
									</div>
									<p className="text-base text-foreground font-semibold text-center">
										{__(
											'There are no sections at the moment. Start adding sections and controlling elements.',
											'doublescale'
										)}
									</p>
								</div>
								<Button
									onClick={handleOpenModal}
									variant="secondary"
									className='p-4'
								>
									<ColumnsLayout />
									{__('Add New Section', 'doublescale')}
								</Button>
							</div>
						) : (
							<>
								{/* Render sections with drop zones */}
								{sections.map((section, index) => (
									<React.Fragment key={section.id}>
										{/* Drop zone before each section */}
										<SectionDropZone
											position="before"
											sectionId={section.id}
											index={index}
											isFirst={index === 0}
										/>

										<SectionRenderer section={section} />

										{/* Drop zone after last section */}
										{index === sections.length - 1 && (
											<SectionDropZone
												position="after"
												sectionId={section.id}
												index={index + 1}
												isLast={true}
											/>
										)}
									</React.Fragment>
								))}

								{/* Add Section Button */}
								<div className="p-4 border-t border-dashed border-border">
									<Button
										variant="outline"
										className="w-full shadow-none border-dashed border-primary text-primary bg-transparent"
										onClick={handleOpenModal}
									>
										{__('Add New Section', 'doublescale')}
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
