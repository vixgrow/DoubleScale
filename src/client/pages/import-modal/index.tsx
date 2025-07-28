/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ImportProvider, useImportContext } from './contexts';
import SourceSelector from './source-selector';
import SourceHeader from './source-header';
import MainContent from './main-content';

interface Props {
	open: boolean;
	onClose: () => void;
	onCompleted: () => void;
}

const ImportModalContent: React.FC<Omit<Props, 'open'>> = ({
	onClose,
	onCompleted,
}) => {
	const { state, resetState } = useImportContext();
	const { currentStep, source } = state;

	const handleClose = () => {
		resetState();
		onClose();
	};

	const handleImportComplete = () => {
		handleClose();
		onCompleted();
	};

	return (
		<div>
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-normal text-[#09090B]">
					{__('Import Contacts', 'quillcrm')}
				</h1>
				<div className="text-base text-[#979797] pr-12">
					{source === 'csv'
						? `Step ${currentStep} of 2`
						: 'Step 1 of 1'}
				</div>
			</div>

			<div className="flex h-full gap-5 mt-8">
				<div className="w-2/5">
					<SourceSelector />
				</div>

				<Card className="w-3/5 shadow-none rounded-[20px]">
					<SourceHeader />
					<CardContent className="p-8">
						<MainContent onImportComplete={handleImportComplete} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

const ImportModal: React.FC<Props> = ({ open, onClose, onCompleted }) => {
	return (
		<ImportProvider>
			<Dialog
				open={open}
				onOpenChange={(value) => {
					if (!value) {
						onClose();
					}
				}}
			>
				<DialogContent className="z-[1600000] w-screen h-screen max-w-none gap-8 overflow-y-auto py-4 px-16 bg-white rounded-none shadow-none">
					<ImportModalContent
						onClose={onClose}
						onCompleted={onCompleted}
					/>
				</DialogContent>
			</Dialog>
		</ImportProvider>
	);
};

export default ImportModal;
