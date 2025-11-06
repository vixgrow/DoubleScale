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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
	const { state, resetState, dispatch } = useImportContext();
	const { currentStep, source } = state;

	const handleClose = () => {
		// Reset the completion state first
		dispatch({ type: 'SET_SHOWING_COMPLETION', payload: false });
		dispatch({ type: 'SET_COUNT', payload: 0 });
		dispatch({ type: 'SET_OFFSET', payload: 0 });
		dispatch({ type: 'SET_CURSOR', payload: null });
		// Then reset the entire state
		resetState();
		onClose();
	};

	const handleImportComplete = async () => {
		// Call onCompleted first to refresh the data
		await onCompleted();
		// Then close the modal
		handleClose();
	};

	return (
		<>
			<DialogHeader className='px-16 pb-4'>
				<DialogTitle>
					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-normal text-[#09090B]">
							{__('Import Contacts', 'quillcrm')}
						</h1>
						<div className="text-base text-[#979797] pr-12">
							{source === 'csv'
								? `Step ${currentStep} of 2`
								: ['mailerlite', 'activecampaign', 'hubspot', 'pipedrive', 'gohighlevel'].includes(source)
									? state.sourceData
										? 'Step 2 of 2'
										: 'Step 1 of 2'
									: 'Step 1 of 1'}
						</div>
					</div>
				</DialogTitle>
			</DialogHeader>
			<div className="overflow-y-auto px-16 pb-8">
				<div className="flex gap-5 ">
					<div className="w-2/5">
						<SourceSelector />
					</div>

					<Card className="w-3/5 shadow-none rounded-[20px]">
						<SourceHeader />
						<CardContent className="p-8">
							<MainContent
								onImportComplete={handleImportComplete}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
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
				<DialogContent className="z-[150000] w-screen h-screen max-w-none gap-0 bg-white rounded-none shadow-none"
				style={{
					paddingTop: '12px',
					paddingLeft: '0px',
					paddingRight: '0px',
					paddingBottom: '0px',
				}}
				>
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
