import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { __ } from '@wordpress/i18n';
import { layoutsStyles } from '../data/layouts';
import { DragDropIcon } from '@quillcrm/components';
import { LayoutTemplate } from '../types';

interface AddNewSectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSectionSelect: (sectionType: LayoutTemplate) => void;
}

const AddNewSectionModal: React.FC<AddNewSectionModalProps> = ({
	isOpen,
	onClose,
	onSectionSelect,
}) => {
	const handleSectionSelect = (sectionType: LayoutTemplate) => {
		onSectionSelect(sectionType);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						<div className="text-3xl mb-1">
							{__('Add New Section', 'quillcrm')}
						</div>
						<div className="text-sm font-normal">
							{__(
								'Select one of this Sections Depending on the shape you want to work on.',
								'quillcrm'
							)}
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-4 py-4">
					{layoutsStyles.map((layout, index) => (
						<Button
							key={`${layout.value}-${index}`}
							variant="outline"
							className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/50"
							onClick={() => handleSectionSelect(layout)}
						>
							<div
								className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 gap-2"
								key={layout.value}
							>
							<DragDropIcon />
							<div className="flex flex-row gap-2 items-center justify-center w-full">
								{layout.width?.map((width, index) => (
									<div
										key={index}
										className="w-full h-full bg-border rounded-sm py-4"
										style={{
											width: `${width}%`,
										}}
									></div>
								))}
							</div>
							{layout.name}
							</div>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddNewSectionModal;
