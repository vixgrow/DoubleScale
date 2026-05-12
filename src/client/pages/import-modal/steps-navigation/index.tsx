/**
 * wordpress dependencies
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
import { isIntegrationApiImportSource } from '../source-definitions';

interface StepNavigationProps {
	onImportContacts: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
	onImportContacts,
}) => {
	const { state, dispatch, returnToSourceStep } = useImportContext();
	const {
		wizardStep,
		currentStep,
		source,
		fileData,
		sourceData,
		isFetching,
		isUploading,
		importing,
	} = state;

	const { validateCredentials, getSourceData } = useImportActions();

	const canProceedCsvUploadToMapping = () => {
		if (source !== 'csv' || wizardStep !== 2) return false;
		if (!fileData) return false;
		return true;
	};

	const handleNext = () => {
		if (canProceedCsvUploadToMapping()) {
			dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
			dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
			return;
		}
		if (source !== 'csv' && !isIntegrationApiImportSource(source)) {
			onImportContacts();
		}
	};

	const handleBack = () => {
		if (source === 'csv' && wizardStep === 3) {
			dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
			dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
			return;
		}
		if (isIntegrationApiImportSource(source) && wizardStep === 3) {
			dispatch({ type: 'SET_SOURCE_DATA', payload: null });
			dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
			dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
			return;
		}
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
	};

	const chooseAnotherBtn = (
		<Button
			type="button"
			variant="outline"
			size="default"
			onClick={returnToSourceStep}
			disabled={importing}
			className="gap-2 border-border/80 text-sm font-medium"
		>
			<ArrowLeft className="h-4 w-4" aria-hidden />
			{__('Choose another source', 'doublescale')}
		</Button>
	);

	// API integrations — wizard step 2: credentials only
	if (
		currentStep === 1 &&
		isIntegrationApiImportSource(source) &&
		wizardStep === 2
	) {
		return (
			<div className="mt-8 space-y-4 border-t border-border/60 pt-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					{chooseAnotherBtn}
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
						className="gap-2 sm:ml-auto"
					>
						<span>
							{isFetching
								? __('Validating...', 'doublescale')
								: __('Connect & fetch data', 'doublescale')}
						</span>
						<ArrowRight className="h-4 w-4" aria-hidden />
					</Button>
				</div>
			</div>
		);
	}

	// Step 1 navigation (CSV upload, or two-step importers on wizard 2)
	if (currentStep === 1) {
		return (
			<div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
				{chooseAnotherBtn}
				<Button
					onClick={handleNext}
					disabled={
						(source === 'csv' &&
							wizardStep === 2 &&
							!canProceedCsvUploadToMapping()) ||
						(['wpfunnelkit', 'fluentcrm', 'memberpress'].includes(source) &&
							!sourceData) ||
						isFetching ||
						isUploading ||
						importing
					}
					className="gap-2 sm:ml-auto"
				>
					<span>
						{isFetching
							? __('Loading...', 'doublescale')
							: source === 'csv' && wizardStep === 2
								? __('Next: map columns', 'doublescale')
								: __('Import contacts', 'doublescale')}
					</span>
					<ArrowRight className="h-4 w-4" aria-hidden />
				</Button>
			</div>
		);
	}

	// CSV mapping (wizard 3) or API integration mapping (wizard 3)
	return (
		<div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
			{chooseAnotherBtn}
			<div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					onClick={handleBack}
					disabled={importing}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden />
					{isIntegrationApiImportSource(source) && wizardStep === 3
						? __('Back to connection', 'doublescale')
						: __('Back', 'doublescale')}
				</Button>
				<Button onClick={onImportContacts} disabled={importing} className="gap-2">
					{importing
						? __('Importing...', 'doublescale')
						: __('Import contacts', 'doublescale')}
					<ArrowRight className="h-4 w-4" aria-hidden />
				</Button>
			</div>
		</div>
	);
};

export default StepNavigation;
