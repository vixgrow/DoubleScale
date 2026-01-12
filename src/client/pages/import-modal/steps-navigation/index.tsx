/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { useImportContext } from '../contexts';
import { useImportActions } from '../use-importActions';

interface StepNavigationProps {
	importer: any;
	onImportContacts: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
	importer,
	onImportContacts,
}) => {
	const { state, dispatch } = useImportContext();
	const {
		currentStep,
		source,
		fileData,
		sourceData,
		isFetching,
		isUploading,
		importing,
	} = state;

	const { validateCredentials, getSourceData } = useImportActions();

	const canProceedToStep2 = () => {
		if (!importer) return false;
		if (source !== 'csv') return false;
		if (source === 'csv' && !fileData) return false;
		return true;
	};

	const handleNext = () => {
		if (canProceedToStep2()) {
			dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
		} else if (source !== 'csv') {
			onImportContacts();
		}
	};

	const handleBack = () => {
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
	};

	// Step 1 navigation
	if (currentStep === 1) {
		return (
			<div className="mt-10 flex justify-end">
				{['mailerlite', 'activecampaign', 'hubspot', 'pipedrive', 'gohighlevel'].includes(
					source
				) ? (
					<>
						{!sourceData ? (
							/* Credentials validation step */
							<Button
								onClick={() => {
									getSourceData();
								}}
								disabled={
									!validateCredentials() ||
									isFetching ||
									isUploading ||
									importing
								}
								className="flex items-center space-x-2"
							>
								<span>
									{isFetching
										? __('Validating...', 'quillcrm')
										: __(
												'Connect & Fetch Data',
												'quillcrm'
											)}
								</span>
								<ArrowRight className="w-4 h-4" />
							</Button>
						) : (
							/* Field mapping step for integrations */
							<div className="flex justify-between w-full">
								<Button
									variant="outline"
									onClick={() => {
										// Reset sourceData to go back to credentials step
										dispatch({ type: 'SET_SOURCE_DATA', payload: null });
										// Reset currentStep to 1 to ensure UI consistency
										dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
										// Also reset any fetching state
										dispatch({ type: 'SET_IS_FETCHING', payload: false });
									}}
									disabled={importing}
									className="flex items-center space-x-2 border-[#1E3A8A] bg-[#FAFAFA] text-[#1E3A8A]"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>{__('Back', 'quillcrm')}</span>
								</Button>
								<Button
									onClick={onImportContacts}
									disabled={
										isFetching || isUploading || importing
									}
									className="flex items-center space-x-2"
								>
									<span>{__('Import Contacts', 'quillcrm')}</span>
									<ArrowRight className="w-4 h-4" />
								</Button>
							</div>
						)}
					</>
				) : (
					<Button
						onClick={handleNext}
						disabled={
							(source === 'csv' && !canProceedToStep2()) ||
							(['wpfunnelkit', 'fluentcrm'].includes(source) &&
								!sourceData) ||
							isFetching ||
							isUploading ||
							importing
						}
						className="flex items-center space-x-2"
					>
						<span>
							{isFetching
								? __('Loading...', 'quillcrm')
								: source === 'csv'
									? __('Next', 'quillcrm')
									: __('Import Contacts', 'quillcrm')}
						</span>
						<ArrowRight className="w-4 h-4" />
					</Button>
				)}
			</div>
		);
	}

	// Step 2 navigation
	return (
		<div className="mt-8 flex justify-between">
			<Button
				variant="outline"
				onClick={handleBack}
				disabled={importing}
				className="flex items-center space-x-2 border-[#1E3A8A] bg-[#FAFAFA] text-[#1E3A8A]"
			>
				<ArrowLeft className="w-4 h-4" />
				<span>{__('Back', 'quillcrm')}</span>
			</Button>
			<Button onClick={onImportContacts} disabled={importing}>
				{importing
					? __('Importing...', 'quillcrm')
					: __('Import Contacts', 'quillcrm')}
				<ArrowRight className="w-4 h-4" />
			</Button>
		</div>
	);
};

export default StepNavigation;
