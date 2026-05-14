import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { __ } from '@wordpress/i18n';
import { layoutsStyles } from '../data/layouts';
import { LayoutTemplate } from '../types';
import { CustomDialogHeader, GradientSectionIcon } from '@doublescale/components';

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
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
		>
			<DialogOverlay />
			<DialogContent className="max-w-[640px] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:max-w-[640px]">
				<DialogHeader className="">
					<CustomDialogHeader
					title={__('Add New Section', 'doublescale')}
					subtitle={__('Select a section layout to add to your email.', 'doublescale')}
					icon={<GradientSectionIcon width={24} height={24} />}
					/>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-2 pt-6">
					{layoutsStyles.map((layout, index) => (
						<Button
							key={`${layout.value}-${layout.id}-${index}`}
							variant="outline"
							className="h-auto flex-col items-stretch gap-1.5 rounded-xl border-border bg-[#F7F8FA] px-[22px] py-[18px] text-left font-normal shadow-none transition-colors hover:border-slate-300 hover:bg-slate-100/80"
							onClick={() => handleSectionSelect(layout)}
						>
							<div className="flex w-full flex-row gap-1.5 rounded-lg">
								{layout.width?.map((width, blockIndex) => (
									<div
										key={blockIndex}
										className="h-8 shrink-0 rounded-md bg-[#D0D0D0]"
										style={{ width: `${width}%` }}
									/>
								))}
							</div>
							<span className="w-full text-center text-sm text-muted-foreground">
								{layout.name}
							</span>
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddNewSectionModal;
