/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import MainContent from './main-content';
import StepNavigation from './steps-navigation';
import {
	ImportSourceFlowBar,
	ImportWizardSidebar,
} from './components/import-wizard-chrome';
import { getImportWizardActiveStepLabel } from './source-definitions';
import { useImportActions } from './use-importActions';
import './style.scss';

function getImportBreadcrumbItems(source: string, wizardStep: number) {
	const items = [
		{
			label: __('Contacts List', 'doublescale'),
			href: 'contacts',
		},
		{
			label: __('Importing Contacts', 'doublescale'),
		},
	];

	const activeStepLabel = getImportWizardActiveStepLabel(source, wizardStep);
	if (activeStepLabel) {
		items.push({ label: activeStepLabel });
	}

	return items;
}

interface Props {
	open: boolean;
	onClose: () => void;
	onCompleted: () => void;
}

interface ImportModalContentProps {
	onDismiss: () => void;
	onCompleted: () => void;
}

const ImportModalContent: React.FC<ImportModalContentProps> = ({
	onDismiss,
	onCompleted,
}) => {
	const navigate = useNavigate();
	const { state, dispatch } = useImportContext();
	const { wizardStep, source } = state;
	const { importContacts } = useImportActions();

	const handleImportComplete = async () => {
		await onCompleted();
		onDismiss();
	};

	const handleImportContacts = async () => {
		await importContacts();
	};

	const handleContinueFromSource = () => {
		if (!source || state.importing) return;
		dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
		dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
	};

	const headerSubtitle = __(
		'Pick one source from the grid. CSV and connected platforms (MailerLite, ActiveCampaign, HubSpot, Pipedrive, GoHighLevel) use three steps; other sources use two.',
		'doublescale'
	);

	const breadcrumbItems = getImportBreadcrumbItems(source, wizardStep);
	const isWizardStep = wizardStep > 1;

	const handleBreadcrumbNavigate = (href: string) => {
		onDismiss();
		navigate(getToLink(href));
	};

	return (
		<>
			<DialogHeader className="shrink-0 border-b border-border/50 bg-white pb-0">
				<DialogTitle className="sr-only">
					{__('Import contacts', 'doublescale')}
				</DialogTitle>
				<div className="mx-auto w-full max-w-[1680px] px-6 pt-3 pb-3">
					<Breadcrumb
						items={breadcrumbItems}
						handleNavigate={handleBreadcrumbNavigate}
					/>
				</div>
			</DialogHeader>

			<div className="import-modal-page-scroll mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-[#F7F8FA] p-6">
				<div
					className={cn(
						'import-modal-content mx-auto flex w-full max-w-[1680px] flex-col rounded-[20px] bg-white p-6 pb-8 shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]',
						isWizardStep && 'import-modal-content--natural-height'
					)}
				>
					{wizardStep > 1 && source && (
						<div className="import-modal__flow-bar-top mb-6 shrink-0">
							<ImportSourceFlowBar />
						</div>
					)}

					{wizardStep === 1 ? (
						<>
							<div className="shrink-0 space-y-2.5">
								<h2 className="text-left text-2xl font-bold leading-9 tracking-tight text-foreground">
									{__('Import contacts', 'doublescale')}
								</h2>
								<p className="text-left text-base leading-6 text-muted-foreground">
									{headerSubtitle}
								</p>
							</div>
							<div className="import-modal__body mt-6 shrink-0">
								<SourceGrid />
							</div>
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
						</>
					) : (
						<>
							<div className="import-modal-wizard__layout import-modal-wizard__layout--natural flex min-w-0 items-start gap-6">
								<ImportWizardSidebar />
								<div className="import-modal-wizard__main import-modal-wizard__main--natural min-w-0 flex-1">
									<MainContent
										onImportComplete={handleImportComplete}
									/>
								</div>
							</div>
							<div className="import-modal__wizard-footer mt-6 shrink-0 pt-6">
								<StepNavigation
									onImportContacts={handleImportContacts}
								/>
							</div>
						</>
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
