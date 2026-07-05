/**
 * Contract read-only detail view.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { useNavigate, getToLink, useParams } from '@doublescale/navigation';
import {
	DeleteIcon,
	DownloadIcon,
	EditHeaderIcon,
	GradientContractBodyEmptyIcon,
	PanelLayout,
	SendTestEmailIcon,
	UserActivityIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	ContractStatusPill,
	SendDocumentDialog,
	ContractAttachmentsPanel,
	ApprovalStatusBanner,
} from '@/components/sales';
import PageTabs from '@/components/page-tabs';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	canWithdrawApproval,
	isApprovalWorkflowEnabled,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	deleteContract,
	downloadContractPdf,
	fetchContractSignature,
	sendContract,
	submitContractForApproval,
	withdrawContractApproval,
	useContract,
	useSalesSettings,
} from '@/hooks/sales';
import type { Contract } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (contract: Contract): string => {
	const c = contract.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({
	label,
	value,
}) => (
	<div className="min-w-0">
		<div className="mb-1 text-sm font-medium text-muted-foreground">{label}</div>
		<div className="text-sm font-semibold text-foreground">{value}</div>
	</div>
);

const DownloadPdfIcon = () => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 18 18"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			opacity="0.2"
			d="M9 18C4.05 18 0 13.95 0 9C0 4.05 4.05 0 9 0C13.95 0 18 4.05 18 9C18 13.95 13.95 18 9 18Z"
			fill="#3A3A99"
		/>
		<path
			d="M8.9992 11.3128C8.8282 11.3128 8.65711 11.2498 8.52211 11.1148L6.59614 9.18881C6.33514 8.92781 6.33514 8.49581 6.59614 8.23481C6.85714 7.97381 7.2892 7.97381 7.5502 8.23481L8.9992 9.68381L10.4482 8.23481C10.7092 7.97381 11.1412 7.97381 11.4022 8.23481C11.6632 8.49581 11.6632 8.92781 11.4022 9.18881L9.4762 11.1148C9.3412 11.2498 9.1702 11.3128 8.9992 11.3128Z"
			fill="#3A3A99"
		/>
		<path
			d="M8.99922 11.3133C8.63022 11.3133 8.32422 11.0073 8.32422 10.6383V4.78828C8.32422 4.41928 8.63022 4.11328 8.99922 4.11328C9.36822 4.11328 9.67422 4.41928 9.67422 4.78828V10.6383C9.67422 11.0163 9.36822 11.3133 8.99922 11.3133Z"
			fill="#3A3A99"
		/>
		<path
			d="M12.1508 13.8871H5.85078C5.48178 13.8871 5.17578 13.5811 5.17578 13.2121C5.17578 12.8431 5.48178 12.5371 5.85078 12.5371H12.1508C12.5198 12.5371 12.8258 12.8431 12.8258 13.2121C12.8258 13.5811 12.5198 13.8871 12.1508 13.8871Z"
			fill="#3A3A99"
		/>
	</svg>
);

const contractViewTabsClassName =
	'h-10 flex-1 rounded-xl px-4 text-base font-normal transition-colors data-[state=active]:border-0 data-[state=active]:bg-[#EEEEFF] data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:border data-[state=inactive]:border-[#DEE1E6] data-[state=inactive]:bg-white data-[state=inactive]:text-[#29292E] data-[state=inactive]:shadow-none hover:data-[state=inactive]:bg-white';

const contractBodyContentClassName =
	'contract-body-content min-w-0 w-full max-w-full overflow-x-auto break-words prose prose-sm max-w-none text-foreground [&_img]:h-auto [&_img]:max-w-full [&_video]:max-w-full [&_iframe]:max-w-full [&_table]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap';

const ContractView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const contractId = params?.id ? Number(params.id) : null;

	const { data: contract, loading, error, refetch } = useContract(contractId);
	const { data: salesSettings } = useSalesSettings();

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [signature, setSignature] = useState<Awaited<
		ReturnType<typeof fetchContractSignature>
	> | null>(null);
	const [signatureLoading, setSignatureLoading] = useState(false);
	const [signatureError, setSignatureError] = useState<string | null>(null);

	const handleClose = () => navigate(getToLink('sales/contracts'));

	const breadcrumbItems = [
		{ label: __('Sales (Contracts)', 'doublescale'), href: 'sales/contracts' },
		{ label: __('Contract Details', 'doublescale') },
	];

	const panelShell = (children: JSX.Element) => (
		<PanelLayout
			items={breadcrumbItems}
			showPanelClose
			fullWidth
			onClosePanel={handleClose}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	useEffect(() => {
		if (!contractId || !contract?.has_signature) {
			setSignature(null);
			setSignatureError(null);
			return;
		}

		let cancelled = false;
		setSignatureLoading(true);
		setSignatureError(null);
		void fetchContractSignature(contractId)
			.then((data) => {
				if (!cancelled) {
					setSignature(data);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setSignature(null);
					setSignatureError(
						err instanceof Error ? err.message : __('Failed to load signature.', 'doublescale')
					);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setSignatureLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [contractId, contract?.has_signature]);

	const handleDelete = async () => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		try {
			await deleteContract(contractId);
			navigate(getToLink('sales/contracts'));
		} finally {
			setBusy(false);
		}
	};

	const handleSend = async (message: string) => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await sendContract(contractId, message);
			await refetch();
			setNotice(__('Contract sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This contract must be approved before it can be sent. Submit it for approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
		}
	};

	const handleSubmitForApproval = async () => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await submitContractForApproval(contractId);
			await refetch();
			setNotice(__('Contract submitted for approval.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleWithdrawApproval = async () => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await withdrawContractApproval(contractId);
			await refetch();
			setNotice(__('Approval request withdrawn. You can edit and re-submit.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to withdraw approval request.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleDownloadPdf = async () => {
		if (!contractId || !contract) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await downloadContractPdf(contractId, contract.contract_number);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('PDF download failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return panelShell(
			<div className="py-12 text-center text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	if (error || !contract) {
		return panelShell(
			<div className="py-12 text-center text-red-600">
				{error || __('Contract not found.', 'doublescale')}
			</div>
		);
	}

	const workflowEnabled = isApprovalWorkflowEnabled(salesSettings, contract);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'contract',
		contract.status,
		contract.approval,
		contract.status === 'expired',
		contract
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'contract',
		contract.status,
		contract.approval,
		contract
	);
	const canEdit = canEditSalesDocument(workflowEnabled, contract.approval, contract);
	const showWithdraw = canWithdrawApproval(contract);
	const hasBodyContent = htmlEditorHasMeaningfulContent(contract.description || '');

	const informationTab = (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 border-b border-border pb-6">
				<DetailField label={__('Subject', 'doublescale')} value={contract.subject || '—'} />
				<DetailField
					label={__('Contract Type', 'doublescale')}
					value={contract.contract_type?.name || '—'}
				/>
				<DetailField
					label={__('Value', 'doublescale')}
					value={formatMoney(contract.contract_value, contract.currency)}
				/>
				<DetailField
					label={__('Start Date', 'doublescale')}
					value={contract.start_date || '—'}
				/>
				<DetailField label={__('End Date', 'doublescale')} value={contract.end_date || '—'} />
			</div>

			<ContractAttachmentsPanel
				contractId={contractId}
				canManage={canEdit}
				layout="form"
				showLogoUpload={false}
				onNotice={setNotice}
				file_classname={'bg-white'}
			/>
		</div>
	);

	const contentTab = hasBodyContent ? (
		<div className="min-w-0 overflow-hidden">
			<div
				className={contractBodyContentClassName}
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{ __html: contract.description || '' }}
			/>
		</div>
	) : (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<GradientContractBodyEmptyIcon />
			<p className="mt-4 text-xl font-semibold text-accent-foreground">
				{__('No contract body content.', 'doublescale')}
			</p>
		</div>
	);

	return panelShell(
		<div className="min-w-0 space-y-6">
			{notice ? (
				<div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			<ApprovalStatusBanner approval={contract.approval} />

			<div className="space-y-6">
				<div className="flex flex-col gap-4 border-b border-border pb-6 xl:flex-row xl:items-start xl:justify-between">
					<div className="min-w-0 space-y-3">
						<h1 className="text-3xl font-bold tracking-tight text-[#09090B]">
							{contract.contract_number}
						</h1>
						<div className="flex flex-wrap items-center gap-3">
							<ContractStatusPill
								status={contract.status}
								expired={contract.is_expired}
								aboutToExpire={contract.is_about_to_expire}
							/>
							<span className="inline-flex items-center gap-1.5 border-l border-border pl-3 text-sm font-medium text-[#475569]">
								<span className="rounded-full border border-border bg-background p-1">
									<UserActivityIcon width={16} height={16} />
								</span>
								{contactName(contract)}
							</span>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
						{showSubmitApproval ? (
							<Button
								variant="outline"
								onClick={() => void handleSubmitForApproval()}
								disabled={busy}
								className="border-primary bg-white text-primary"
							>
								{__('Submit for Approval', 'doublescale')}
							</Button>
						) : null}
						{showWithdraw ? (
							<Button
								variant="outline"
								onClick={() => void handleWithdrawApproval()}
								disabled={busy}
								className="border-primary bg-white text-primary"
							>
								{__('Withdraw Request', 'doublescale')}
							</Button>
						) : null}
						{showSend ? (
							<Button onClick={() => setSendOpen(true)} disabled={busy}>
								{__('Send to Customer', 'doublescale')}
								<SendTestEmailIcon width={24} height={24} />
							</Button>
						) : null}
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 shrink-0 border-primary bg-white"
							onClick={() => void handleDownloadPdf()}
							disabled={busy}
							aria-label={__('Download PDF', 'doublescale')}
						>
							<DownloadIcon />
						</Button>
						{canEdit ? (
							<Button
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 border-[#0D9DFC] bg-white text-[#0D9DFC] hover:bg-[#DBEAFE]"
								onClick={() =>
									navigate(getToLink(`sales/contracts/${contract.id}/edit`))
								}
								aria-label={__('Edit', 'doublescale')}
							>
								<EditHeaderIcon color="#0D9DFC" width={20} height={20} />
							</Button>
						) : null}
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 shrink-0 border-destructive bg-white text-destructive hover:bg-[#FEE2E2]"
							onClick={() => setDeleteOpen(true)}
							disabled={busy}
							aria-label={__('Delete', 'doublescale')}
						>
							<DeleteIcon width={20} height={20} />
						</Button>
					</div>
				</div>

				<div className="min-w-0 overflow-hidden rounded-xl border border-[#DEE1E6] bg-accent p-6">
					<PageTabs
						className="min-w-0"
						defaultValue="information"
						tabsListWrapperClassName="mb-6 border-b border-border pb-6"
						tabsListClassName="flex h-auto w-full max-w-sm flex-col sm:flex-row gap-3 bg-transparent p-0"
						tabsTriggerClassName={contractViewTabsClassName}
						tabsList={[
							{
								value: 'information',
								label: __('Contract Information', 'doublescale'),
							},
							{ value: 'content', label: __('Content', 'doublescale') },
						]}
						tabsContent={[
							{ value: 'information', children: informationTab },
							{ value: 'content', children: contentTab },
						]}
					/>
				</div>

				{contract.has_signature || contract.signed_name ? (
					<div className="rounded-xl border border-[#DEE1E6] bg-white p-6 space-y-3">
						<h2 className="text-base font-semibold text-foreground">
							{__('Signature', 'doublescale')}
						</h2>
						{contract.signed_name ? (
							<p className="text-sm">
								<span className="text-muted-foreground">
									{__('Signed by', 'doublescale')}:{' '}
								</span>
								<span className="font-medium">{contract.signed_name}</span>
							</p>
						) : null}
						{contract.signed_at ? (
							<p className="text-sm text-muted-foreground">
								{__('Signed at', 'doublescale')}: {contract.signed_at}
							</p>
						) : null}
						{signatureLoading ? (
							<p className="text-sm text-muted-foreground">
								{__('Loading signature…', 'doublescale')}
							</p>
						) : signatureError ? (
							<p className="text-sm text-red-600">{signatureError}</p>
						) : signature?.signature ? (
							<div className="inline-block max-w-full rounded border bg-slate-50 p-4">
								<img
									src={signature.signature}
									alt={__('Customer signature', 'doublescale')}
									className="max-h-40 max-w-full"
								/>
							</div>
						) : contract.has_signature ? (
							<p className="text-sm text-muted-foreground">
								{__('Signature on file.', 'doublescale')}
							</p>
						) : null}
					</div>
				) : null}
			</div>

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Contract', 'doublescale')}
				description={__(
					'Do you really want to delete this contract?',
					'doublescale'
				)}
				confirmLabel={__('Confirm', 'doublescale')}
				destructive
				busy={busy}
				onConfirm={handleDelete}
			/>

			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				documentType="contract"
				title={__('Send Contract', 'doublescale')}
				description={__(
					'Send this contract to the customer by email? They will receive a link to view and sign.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busy}
				onConfirm={handleSend}
			/>
		</div>
	);
};

export default ContractView;
