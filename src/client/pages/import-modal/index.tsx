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
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportProvider, useImportContext } from './contexts';
import SourceGrid from './source-grid';
import SourceHeader from './source-header';
import MainContent from './main-content';
import {
	isIntegrationApiImportSource,
	isThreeStepImportSource,
} from './source-definitions';

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
	const { state, returnToSourceStep } = useImportContext();
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

	return (
		<div className="relative flex max-h-[min(90vh,940px)] min-h-[min(52vh,520px)] flex-col overflow-hidden rounded-[inherit] bg-card">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-primary via-primary/90 to-primary/60"
				aria-hidden
			/>

			<header className="relative shrink-0 border-b border-border/50 bg-card px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7 pr-14 sm:pr-16">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
					<div className="min-w-0 flex-1 space-y-1.5">
						<DialogTitle className="text-left text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
							{__('Import contacts', 'doublescale')}
						</DialogTitle>
						<DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground ">
							{wizardStep === 1
								? __(
										'Pick one source from the grid. CSV and connected platforms (MailerLite, ActiveCampaign, HubSpot, Pipedrive, GoHighLevel) use three steps; FluentCRM, FunnelKit, MemberPress, WordPress users, WooCommerce, and other sources use two.',
										'doublescale'
									)
								: __(
										'Follow the stages below. You can change the source until you start importing.',
										'doublescale'
									)}
						</DialogDescription>
					</div>

					{wizardStep > 1 && source && (
						<div className="flex w-full flex-col gap-2.5 lg:max-w-sm">
							<div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{sprintf(
										/* translators: 1: current step, 2: total steps */
										__('Step %1$d of %2$d', 'doublescale'),
										displayStep,
										totalSteps
									)}
								</p>
								<span className="hidden h-3 w-px bg-border sm:inline" aria-hidden />
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
							<StepSegmentBar
								totalSteps={totalSteps}
								activeStep={displayStep}
							/>
							<p className="text-sm font-medium leading-snug text-foreground">
								{stepLabel}
							</p>
						</div>
					)}
				</div>
			</header>

			{wizardStep === 1 ? (
				<SourceGrid />
			) : (
				<div className="flex min-h-0 flex-1 flex-col">
					<SourceHeader />
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
						<MainContent onImportComplete={handleImportComplete} />
					</div>
				</div>
			)}
		</div>
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
			onOpenChange={(value) => {
				if (!value) {
					handleDismiss();
				}
			}}
		>
			<DialogContent
				className={cn(
					'z-[150000] gap-0 overflow-hidden p-0',
					'w-[calc(100vw-1rem)] max-w-[1200px]',
					'max-h-[min(94vh,960px)] rounded-xl border border-border/80',
					'bg-card shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]',
					'data-[state=open]:animate-in data-[state=closed]:animate-out',
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
					'data-[state=closed]:zoom-out-[0.99] data-[state=open]:zoom-in-[0.99]',
					'data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2'
				)}
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
