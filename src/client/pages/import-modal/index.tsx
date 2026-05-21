/**
 * wordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
import { cn } from '@/lib/utils';
/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@doublescale/components';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { ImportProvider, useImportContext } from './contexts';
import SourceGrid from './source-grid';
import SourceHeader from './source-header';
import MainContent from './main-content';
import {
	isIntegrationApiImportSource,
	isThreeStepImportSource,
} from './source-definitions';
import './style.scss';

interface Props {
	open: boolean;
	onClose: () => void;
	onCompleted: () => void;
}

interface ImportModalContentProps {
	onDismiss: () => void;
	onCompleted: () => void;
}

function StepSegmentBar({
	totalSteps,
	activeStep,
}: {
	totalSteps: number;
	activeStep: number;
}) {
	return (
		<div
			className="flex w-full gap-1.5"
			role="progressbar"
			aria-valuenow={activeStep}
			aria-valuemin={1}
			aria-valuemax={totalSteps}
			aria-label={__('Import steps', 'doublescale')}
		>
			{Array.from({ length: totalSteps }, (_, i) => {
				const stepIndex = i + 1;
				const complete = activeStep > stepIndex;
				const active = activeStep === stepIndex;
				return (
					<div
						key={stepIndex}
						className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
					>
						<div
							className={cn(
								'h-full rounded-full transition-all duration-500 ease-out',
								complete && 'w-full bg-primary',
								active && !complete && 'w-full bg-primary/70',
								!active && !complete && 'w-0 bg-transparent'
							)}
						/>
					</div>
				);
			})}
		</div>
	);
}

const ImportModalContent: React.FC<ImportModalContentProps> = ({
	onDismiss,
	onCompleted,
}) => {
	const navigate = useNavigate();
	const { state, returnToSourceStep, dispatch } = useImportContext();
	const { wizardStep, source } = state;

	const totalSteps = !source ? 1 : isThreeStepImportSource(source) ? 3 : 2;
	const displayStep =
		wizardStep === 1 ? 1 : isThreeStepImportSource(source) ? wizardStep : 2;

	const stepLabel =
		wizardStep === 1
			? __('Choose import source', 'doublescale')
			: source === 'csv' && wizardStep === 2
				? __('Upload your CSV file', 'doublescale')
				: source === 'csv' && wizardStep === 3
					? __('Map columns to contact fields', 'doublescale')
					: isIntegrationApiImportSource(source) && wizardStep === 2
						? __('Connect your account', 'doublescale')
						: isIntegrationApiImportSource(source) && wizardStep === 3
							? __('Map fields and import', 'doublescale')
							: __('Connect, map, and import', 'doublescale');

	const handleImportComplete = async () => {
		await onCompleted();
		onDismiss();
	};

	const handleContinueFromSource = () => {
		if (!source || state.importing) return;
		dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
	};

	const headerSubtitle =
		wizardStep === 1
			? __(
					'Pick one source from the grid. CSV and connected platforms (MailerLite, ActiveCampaign, HubSpot, Pipedrive, GoHighLevel) use three steps; other sources use two.',
					'doublescale'
				)
			: __(
					'Follow the stages below. You can change the source until you start importing.',
					'doublescale'
				);

	const handleBreadcrumbNavigate = (href: string) => {
		onDismiss();
		navigate(getToLink(href));
	};

	return (
		<>
			<DialogHeader className="shrink-0 border-b border-border/50 bg-white/90 pb-0 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
				<DialogTitle className="sr-only">
					{__('Import contacts', 'doublescale')}
				</DialogTitle>
				<div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-6 py-3 ">
					<Breadcrumb
						items={[
							{
								label: __('Contacts List', 'doublescale'),
								href: 'contacts',
							},
							{
								label: __('Importing Contacts', 'doublescale'),
							},
						]}
						handleNavigate={handleBreadcrumbNavigate}
					/>
				</div>
			</DialogHeader>

			<div className="import-modal-page-scroll mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-6 bg-[#F7F8FA]">
				<div className="import-modal-content flex shrink-0 flex-col rounded-[20px] bg-[#fff] p-6 pb-8 shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]">
					<div className="shrink-0 space-y-2.5">
						<h2 className="text-left font-bold tracking-tight text-foreground leading-9 text-2xl">
							{__('Import contacts', 'doublescale')}
						</h2>
						<p className="text-left text-base leading-6 text-muted-foreground">
							{headerSubtitle}
						</p>
					</div>

					{wizardStep > 1 && source && (
						<div className="mt-5 shrink-0 ">
							<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{sprintf(
										/* translators: 1: current step, 2: total steps */
										__('Step %1$d of %2$d', 'doublescale'),
										displayStep,
										totalSteps
									)}
								</p>
								<span
									className="hidden h-3 w-px bg-border sm:inline"
									aria-hidden
								/>
								<Button
									type="button"
									variant="link"
									size="sm"
									className="h-auto p-0 text-sm font-medium text-primary"
									onClick={returnToSourceStep}
									disabled={state.importing}
								>
									{__('Choose another source', 'doublescale')}
								</Button>
							</div>
							<div className="mt-3">
								<StepSegmentBar
									totalSteps={totalSteps}
									activeStep={displayStep}
								/>
							</div>
							<p className="mt-2 text-sm font-medium text-foreground">
								{stepLabel}
							</p>
						</div>
					)}

					<div
						className={cn(
							'import-modal__body mt-6',
							wizardStep === 1 ? 'shrink-0' : 'min-h-0 flex-1'
						)}
					>
						{wizardStep === 1 ? (
							<SourceGrid />
						) : (
							<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
								<SourceHeader />
								<div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6 sm:py-8">
									<MainContent
										onImportComplete={handleImportComplete}
									/>
								</div>
							</div>
						)}
					</div>

					{wizardStep === 1 && (
						<div className="import-modal__footer">
							<Button
								type="button"
								variant="default"
								
								
								disabled={!source || state.importing}
								onClick={handleContinueFromSource}
							>
								{__('Continue', 'doublescale')}
							</Button>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

const ImportModalInner: React.FC<Props> = ({
	open,
	onClose,
	onCompleted,
}) => {
	const { resetState, dispatch } = useImportContext();

	const handleDismiss = () => {
		dispatch({ type: 'SET_SHOWING_COMPLETION', payload: false });
		dispatch({ type: 'SET_COUNT', payload: 0 });
		dispatch({ type: 'SET_OFFSET', payload: 0 });
		dispatch({ type: 'SET_CURSOR', payload: null });
		dispatch({
			type: 'SET_IMPORT_STATS',
			payload: { imported: 0, skipped: 0, failed: 0 },
		});
		resetState();
		onClose();
	};

	return (
		<Dialog
			open={open}
			modal={false}
			onOpenChange={(value) => {
				if (!value) {
					handleDismiss();
				}
			}}
		>
			<DialogContent
				className={cn(
					'doublescale-import-modal z-[150000] flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-[#eef1f7] to-slate-100/95 p-0 shadow-none',
					'[&>button]:right-6 [&>button]:top-4 [&>button]:text-muted-foreground [&>button]:hover:bg-muted/60 sm:[&>button]:right-10 sm:[&>button]:top-5'
				)}
				style={{
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,
					paddingBottom: 0,
				}}
			>
				<ImportModalContent
					onDismiss={handleDismiss}
					onCompleted={onCompleted}
				/>
			</DialogContent>
		</Dialog>
	);
};

const ImportModal: React.FC<Props> = (props) => {
	return (
		<ImportProvider>
			<ImportModalInner {...props} />
		</ImportProvider>
	);
};

export default ImportModal;
