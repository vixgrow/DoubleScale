/**
 * Proposal read-only detail view.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Files, User } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import {
	CalendarIcon,
	ContactTotalEmailsIcon,
	CopyIcon,
	CurrencyIcon,
	DeleteIcon,
	DownloadIcon,
	EditHeaderIcon,
	GradientProposalsIcon,
	LocationIcon,
	PanelLayout,
	PhoneIcon,
	PurchaseHistoryIcon,
	SendEmailIcon,
	SendTestEmailIcon,
	UserActivityIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	ConfirmDialog,
	SendDocumentDialog,
	ConvertToInvoiceDialog,
	ApprovalStatusBanner,
	ProposalStatusPill,
	ProposalDocumentPreview,
	ProposalFormDialog,
} from '@/components/sales';
import { DocumentEditorSidebar } from '@/components/sales/document-templates/document-editor-sidebar';
import { computeAmount } from '@/components/sales/line-items-editor';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	canWithdrawApproval,
	isApprovalWorkflowEnabled,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	changeProposalStatus,
	convertProposalToInvoice,
	deleteProposal,
	duplicateProposal,
	downloadProposalPdf,
	fetchProposalSignature,
	sendProposal,
	submitProposalForApproval,
	withdrawProposalApproval,
	useProposal,
	useSalesSettings,
} from '@/hooks/sales';
import type { ProposalSignature } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const InfoItem: React.FC<{
	icon: React.ReactNode;
	children: React.ReactNode;
}> = ({ icon, children }) => (
	<div className="flex items-start gap-2.5 text-sm text-muted-foreground">
		<span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
		<span className="min-w-0 break-words">{children}</span>
	</div>
);

const cardClass = 'rounded-xl border border-border bg-background p-4';

const ProposalView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const proposalId = params?.id ? Number(params.id) : null;

	const { data: proposal, loading, error, refetch } = useProposal(proposalId);
	const { data: salesSettings } = useSalesSettings();

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [convertOpen, setConvertOpen] = useState(false);
	const [markAcceptedOpen, setMarkAcceptedOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	// Manual accept for deals closed outside the public link (phone, WhatsApp).
	const showMarkAccepted = (status: string) =>
		status !== 'accepted' && status !== 'declined';
	const [signature, setSignature] = useState<ProposalSignature | null>(null);
	const [signatureLoading, setSignatureLoading] = useState(false);
	const [signatureError, setSignatureError] = useState<string | null>(null);

	useEffect(() => {
		if (!proposalId || !proposal?.has_signature) {
			setSignature(null);
			setSignatureError(null);
			return;
		}

		let cancelled = false;
		setSignatureLoading(true);
		setSignatureError(null);
		void fetchProposalSignature(proposalId)
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
	}, [proposalId, proposal?.has_signature]);

	const handleClose = () => navigate(getToLink('sales/proposals'));

	const breadcrumbItems = [
		{ label: __('Sales (Proposals)', 'doublescale'), href: 'sales/proposals' },
		{ label: __('Proposal Details', 'doublescale') },
	];

	const panelShell = (children: JSX.Element) => (
		<PanelLayout
			items={breadcrumbItems}
			showPanelClose
			onClosePanel={handleClose}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	const handleDelete = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		try {
			await deleteProposal(proposalId);
			navigate(getToLink('sales/proposals'));
		} finally {
			setBusy(false);
		}
	};

	const handleSend = async (message: string) => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await sendProposal(proposalId, message);
			await refetch();
			setNotice(__('Proposal sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This proposal must be approved before it can be sent. Submit it for approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
		}
	};

	const handleSubmitForApproval = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await submitProposalForApproval(proposalId);
			await refetch();
			setNotice(__('Proposal submitted for approval.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleWithdrawApproval = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await withdrawProposalApproval(proposalId);
			await refetch();
			setNotice(__('Approval request withdrawn. You can edit and re-submit.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to withdraw approval request.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleConvert = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const result = await convertProposalToInvoice(proposalId);
			navigate(getToLink(`sales/invoices/${result.invoice.id}`));
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Convert to invoice failed.', 'doublescale'), {
					approval_required: __(
						'This proposal must be approved before it can be converted to an invoice.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
			setConvertOpen(false);
		}
	};

	const handleDuplicate = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const copy = await duplicateProposal(proposalId);
			navigate(getToLink(`sales/proposals/${copy.id}/edit`));
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Duplicate failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	const handleCopyLink = async () => {
		if (!proposal?.public_url) {
			setNotice(
				__(
					'Add a WordPress page with the [doublescale_proposal] shortcode first.',
					'doublescale'
				)
			);
			return;
		}
		setNotice(null);
		try {
			await navigator.clipboard.writeText(proposal.public_url);
			setNotice(__('Public link copied.', 'doublescale'));
		} catch {
			setNotice(proposal.public_url);
		}
	};

	const handleMarkAccepted = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await changeProposalStatus(proposalId, 'accepted');
			await refetch();
			setNotice(__('Proposal marked as accepted.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(
					err,
					__('Failed to update the proposal status.', 'doublescale')
				)
			);
		} finally {
			setBusy(false);
			setMarkAcceptedOpen(false);
		}
	};

	const handleDownloadPdf = async () => {
		if (!proposalId || !proposal) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await downloadProposalPdf(proposalId, proposal.proposal_number);
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

	if (error || !proposal) {
		return panelShell(
			<div className="py-12 text-center text-red-600">
				{error || __('Proposal not found.', 'doublescale')}
			</div>
		);
	}

	const showConvert = proposal.status !== 'declined' && !proposal.invoice_id;
	const workflowEnabled = isApprovalWorkflowEnabled(salesSettings, proposal);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'proposal',
		proposal.status,
		proposal.approval,
		proposal.status === 'declined',
		proposal
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'proposal',
		proposal.status,
		proposal.approval,
		proposal
	);
	const canEdit = canEditSalesDocument(workflowEnabled, proposal.approval, proposal);
	const showWithdraw = canWithdrawApproval(proposal);
	const convertWarning =
		proposal.status !== 'accepted'
			? __('This will mark the proposal as Accepted.', 'doublescale')
			: __('Create a draft invoice from this proposal?', 'doublescale');

	const lineItems = (proposal.line_items || []).filter((item) => !item.optional);
	const cityState = [proposal.city, proposal.state].filter(Boolean).join(', ');
	const addressLine = [proposal.address, cityState].filter(Boolean).join(' / ');

	return panelShell(
		<div className="space-y-6">
			{notice ? (
				<div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			<ApprovalStatusBanner approval={proposal.approval} />

			<div className="space-y-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-border pb-6">
					<div className="min-w-0 space-y-3">
						<h1 className="text-3xl font-bold tracking-tight text-[#09090B]">
							{proposal.proposal_number}
						</h1>
						<div className="flex flex-wrap items-center gap-3">
							<ProposalStatusPill
								status={proposal.status}
								expired={proposal.is_expired}
							/>
							{proposal.subject ? (
								<span className="inline-flex items-center gap-1.5 border-l border-border px-3 text-sm font-medium text-[#475569]">
									<span className="bg-background border border-border rounded-full p-1">
										<UserActivityIcon />
									</span>
									{proposal.subject}
								</span>
							) : null}
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
						{showSubmitApproval ? (
							<Button
								variant="outline"
								onClick={() => void handleSubmitForApproval()}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								{__('Submit for Approval', 'doublescale')}
							</Button>
						) : null}
						{showWithdraw ? (
							<Button
								variant="outline"
								onClick={() => void handleWithdrawApproval()}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								{__('Withdraw Request', 'doublescale')}
							</Button>
						) : null}
						{proposal.invoice_id ? (
							<Button
								variant="outline"
								onClick={() =>
									navigate(
										getToLink(
											`sales/invoices/${proposal.invoice_id}`
										)
									)
								}
								className="border-primary text-primary bg-white"
							>
								{__('View Invoice', 'doublescale')}
							</Button>
						) : showConvert ? (
							<Button
								variant="outline"
								className="border-primary text-primary bg-white"
								onClick={() => setConvertOpen(true)}
								disabled={busy}
							>
								<PurchaseHistoryIcon />
								{__('Convert to Invoice', 'doublescale')}
							</Button>
						) : null}
						{showMarkAccepted(proposal.status) ? (
							<Button
								variant="outline"
								onClick={() => setMarkAcceptedOpen(true)}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								{__('Mark as Accepted', 'doublescale')}
							</Button>
						) : null}
						{showSend ? (
							<Button
								variant="outline"
								onClick={() => setSendOpen(true)}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								<SendTestEmailIcon width={24} height={24} />
								{__('Send to Customer', 'doublescale')}
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
						{proposal.public_url ? (
							<Button
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 border-primary bg-white text-[#3A3A99]"
								onClick={() => void handleCopyLink()}
								disabled={busy}
								aria-label={__('Copy Link', 'doublescale')}
								title={__('Copy public link', 'doublescale')}
							>
								<CopyIcon width={20} height={20} />
							</Button>
						) : null}
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 shrink-0 border-primary bg-white text-[#3A3A99]"
							onClick={() => void handleDuplicate()}
							disabled={busy}
							aria-label={__('Duplicate', 'doublescale')}
							title={__('Duplicate proposal', 'doublescale')}
						>
							<Files width={20} height={20} />
						</Button>
						{canEdit ? (
							<Button
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 border-[#0D9DFC] bg-white text-[#0D9DFC] hover:bg-[#DBEAFE]"
								onClick={() => setEditOpen(true)}
								aria-label={__('Edit', 'doublescale')}
							>
								<EditHeaderIcon
									color="#0D9DFC"
									width={20}
									height={20}
								/>
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

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(400px,34vw)] xl:items-start">
					<div className="min-w-0 space-y-6">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className={cardClass}>
						<h2 className="mb-4 text-base font-semibold text-accent-foreground">
							{__('To', 'doublescale')}
						</h2>
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div className="space-y-6">
								{proposal.to_name ? (
									<InfoItem
										icon={
											<UserActivityIcon
												width={18}
												height={18}
											/>
										}
									>
										{proposal.to_name}
									</InfoItem>
								) : null}
								{proposal.phone ? (
									<InfoItem
										icon={
											<PhoneIcon width={18} height={18} />
										}
									>
										{proposal.phone}
									</InfoItem>
								) : null}
								{addressLine ? (
									<InfoItem
										icon={
											<LocationIcon
												width={18}
												height={18}
											/>
										}
									>
										{addressLine}
									</InfoItem>
								) : null}
							</div>
							<div className="space-y-3">
								{proposal.email ? (
									<InfoItem
										icon={
											<ContactTotalEmailsIcon
												width={18}
												height={18}
											/>
										}
									>
										{proposal.email}
									</InfoItem>
								) : null}
								{proposal.zip ? (
									<InfoItem
										icon={
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													opacity="0.4"
													d="M10.3526 11.3071C10.2514 11.2318 10.1393 11.1581 10.0364 11.0842C8.41532 9.92025 7.61351 7.89005 8.59747 6.03573C9.30947 4.69391 10.6381 3.82951 12.0687 3.38072C14.0845 2.7483 16.4053 2.89825 18.2899 3.87188C19.5501 4.52613 20.6682 5.64312 20.938 7.08177C20.9583 7.19015 20.9669 7.36537 21.0007 7.46348V8.02746C20.965 8.12684 20.9561 8.30952 20.9344 8.41993C20.6432 9.90357 19.4721 11.0277 18.1597 11.6795C16.8017 12.3539 15.2522 12.5894 13.7482 12.4453C13.5195 12.4234 13.2885 12.3713 13.0606 12.3669C13.0263 12.3663 12.724 12.5054 12.6726 12.5279L11.8443 12.8907L10.6163 13.4266C10.4333 13.5069 10.2234 13.6138 10.0394 13.6709C9.75807 13.748 9.49046 13.4726 9.58196 13.1951C9.6485 12.9933 9.73699 12.7985 9.81743 12.6042L10.3526 11.3071ZM15.4431 7.56201C15.3128 7.63995 15.2081 7.75811 15.1741 7.91715C15.0961 8.28089 15.1694 8.71818 15.586 8.82226C15.7207 8.85593 15.9431 8.84125 16.0878 8.84014C16.2759 8.83436 16.4062 8.79836 16.5411 8.65748C16.7018 8.48966 16.701 8.29997 16.695 8.08244C16.6889 7.86242 16.6045 7.67217 16.4047 7.56324C16.4947 7.46976 16.574 7.3886 16.6045 7.25695C16.6581 7.02572 16.5974 6.7883 16.4231 6.62358C16.252 6.46179 16.0609 6.45143 15.8371 6.45886C15.8223 6.45931 15.8074 6.46007 15.7926 6.46113C15.6614 6.48173 15.5915 6.49911 15.4812 6.5767C15.2093 6.76795 15.139 7.20606 15.3503 7.4653C15.3764 7.4973 15.4132 7.53212 15.4431 7.56201ZM11.5504 6.93486C11.5182 6.95007 11.4826 6.96969 11.4762 7.00693C11.4401 7.21767 11.4615 7.52947 11.4565 7.74764C11.3074 7.75024 11.1583 7.75103 11.0092 7.75003C10.9216 7.75001 10.8281 7.74402 10.7415 7.75767C10.7167 7.76158 10.6951 7.7674 10.6781 7.78738C10.6362 7.83667 10.639 7.93587 10.6483 7.99705C10.6524 8.02407 10.6644 8.05451 10.6871 8.07128C10.7723 8.13424 11.3167 8.10237 11.4601 8.10946C11.4572 8.23177 11.4329 8.81051 11.4946 8.87865C11.5359 8.92428 11.6196 8.92341 11.6755 8.92071C11.6974 8.91966 11.719 8.9184 11.7407 8.91496C11.8558 8.84435 11.8237 8.67256 11.8266 8.55251C11.8303 8.40397 11.8224 8.25338 11.8267 8.10442L12.2682 8.1058C12.3461 8.10601 12.4346 8.11455 12.5109 8.09982C12.5453 8.0932 12.5845 8.08057 12.6095 8.05468C12.6449 8.018 12.6423 7.93261 12.6389 7.88331C12.6363 7.84789 12.6283 7.79884 12.5975 7.77619C12.5006 7.70488 11.9307 7.79085 11.8482 7.74597C11.8375 7.74014 11.832 7.72364 11.8294 7.71342C11.7937 7.57029 11.8829 7.01797 11.77 6.95118C11.7173 6.91999 11.6109 6.93293 11.5504 6.93486ZM17.6528 8.82977C17.7418 8.79486 17.767 8.73008 17.803 8.64759C17.9768 8.24993 18.1379 7.84562 18.3047 7.4449C18.3699 7.28811 18.5139 6.98648 18.5512 6.83527C18.5722 6.75037 18.5737 6.63493 18.5437 6.55263C18.5297 6.51439 18.5025 6.49141 18.4656 6.47613C18.3702 6.43666 17.332 6.44809 17.1523 6.46069C17.0282 6.52069 16.9902 6.66374 17.0419 6.78412C17.0832 6.82098 17.2002 6.81813 17.2574 6.81664C17.5576 6.80879 17.8671 6.8269 18.1664 6.81648C17.899 7.42403 17.6632 8.05685 17.3998 8.66721C17.3817 8.70927 17.3379 8.813 17.4056 8.82663C17.4767 8.84681 17.582 8.84547 17.6528 8.82977ZM13.7233 6.46216C13.3839 6.51723 13.1497 6.74689 13.1631 7.12667C13.1661 7.21162 13.3921 7.20157 13.4453 7.18232C13.5714 7.13663 13.5126 6.90463 13.6692 6.85435C13.8083 6.80258 14.0026 6.81131 14.1453 6.84783C14.3056 6.89659 14.3359 7.1323 14.2772 7.2674C14.1766 7.49838 13.8911 7.33758 13.7766 7.50414C13.7479 7.55892 13.7255 7.74206 13.8048 7.76361C13.9646 7.80706 14.2099 7.71839 14.2802 7.93896C14.3358 8.11345 14.3302 8.41222 14.1109 8.46956C13.9713 8.50605 13.7685 8.50952 13.6356 8.44913C13.5341 8.40059 13.5039 8.31741 13.4882 8.21371L13.4862 8.20221C13.4767 8.15257 13.4653 8.10524 13.4175 8.07538C13.3552 8.03652 13.1778 8.00352 13.1377 8.09047C13.0981 8.17639 13.1322 8.33108 13.1608 8.42013C13.2105 8.5677 13.3261 8.70089 13.463 8.77323C13.6231 8.85406 13.8273 8.84153 14.0015 8.83996C14.0913 8.83916 14.1767 8.83333 14.26 8.80174C14.4191 8.74064 14.5471 8.61827 14.6153 8.46205C14.728 8.20108 14.6906 7.79149 14.4559 7.60178C14.5303 7.51224 14.6082 7.42561 14.6405 7.31051C14.7129 7.05249 14.6524 6.76871 14.4406 6.59416C14.2453 6.43323 13.9638 6.44534 13.7233 6.46216Z"
													fill="#6B6C76"
												/>
												<path
													d="M15.7433 7.77928C16.0465 7.75285 16.358 7.74038 16.3359 8.13753C16.3259 8.31846 16.3174 8.42077 16.1222 8.47908C15.9521 8.4876 15.5637 8.53262 15.5283 8.30779C15.4945 8.09382 15.4894 7.8393 15.7433 7.77928Z"
													fill="#6B6C76"
												/>
												<path
													d="M15.831 6.82227C15.931 6.81718 16.0355 6.81141 16.1276 6.8637C16.2739 6.94667 16.2931 7.15681 16.2089 7.29065C16.1639 7.36205 16.1043 7.3939 16.0219 7.40973C15.8371 7.42499 15.6321 7.40494 15.5926 7.18502C15.5603 7.00501 15.6461 6.84932 15.831 6.82227Z"
													fill="#6B6C76"
												/>
												<path
													opacity="0.4"
													d="M9.25545 15.3557L7.16604 17.4451C6.93602 17.2406 6.71238 17.0298 6.49513 16.8125C5.837 16.148 5.24276 15.4515 4.71242 14.7231C4.18847 13.9947 3.76676 13.2663 3.46005 12.5443C3.15335 11.8158 3 11.1194 3 10.4548C3 10.0204 3.07668 9.60503 3.23003 9.22165C3.38338 8.83188 3.62618 8.47406 3.96483 8.15458C4.37377 7.75203 4.82105 7.55396 5.29388 7.55396C5.47279 7.55396 5.6517 7.59229 5.81144 7.66897C5.97757 7.74564 6.12453 7.86066 6.23955 8.02679L7.72194 10.1162C7.83695 10.2759 7.92002 10.4229 7.97753 10.5635C8.03503 10.6977 8.06698 10.8318 8.06698 10.9532C8.06698 11.1066 8.02225 11.2599 7.9328 11.4069C7.84973 11.5539 7.72833 11.7072 7.57498 11.8606L7.08937 12.3654C7.01908 12.4356 6.98713 12.5187 6.98713 12.6209C6.98713 12.6721 6.99352 12.7168 7.0063 12.7679C7.02547 12.819 7.04464 12.8574 7.05742 12.8957C7.17243 13.1065 7.37051 13.3813 7.65165 13.7136C7.93919 14.0458 8.24589 14.3845 8.57815 14.7231C8.80818 14.9468 9.03182 15.164 9.25545 15.3557Z"
													fill="#6B6C76"
												/>
												<path
													d="M15.7594 17.9877C15.7594 18.1666 15.7275 18.3519 15.6636 18.5309C15.6444 18.582 15.6253 18.6331 15.5997 18.6842C15.4911 18.9142 15.3505 19.1315 15.1652 19.3359C14.8521 19.681 14.5071 19.9302 14.1173 20.0899C14.1109 20.0899 14.1045 20.0963 14.0981 20.0963C13.7212 20.2497 13.3122 20.3327 12.8713 20.3327C12.2196 20.3327 11.5231 20.1794 10.7883 19.8663C10.0535 19.5532 9.3187 19.1315 8.59028 18.6011C8.34108 18.4158 8.09189 18.2305 7.85547 18.0325L9.94488 15.9431C10.1238 16.0772 10.2835 16.1795 10.4177 16.2498C10.4497 16.2625 10.488 16.2817 10.5327 16.3009C10.5838 16.32 10.635 16.3264 10.6925 16.3264C10.8011 16.3264 10.8842 16.2881 10.9544 16.2178L11.4401 15.7386C11.5998 15.5788 11.7531 15.4574 11.9001 15.3808C12.0471 15.2913 12.194 15.2466 12.3538 15.2466C12.4752 15.2466 12.603 15.2721 12.7435 15.3296C12.8841 15.3872 13.0311 15.4702 13.1908 15.5788L15.3058 17.0804C15.4719 17.1954 15.5869 17.3296 15.6572 17.4893C15.7211 17.6491 15.7594 17.8088 15.7594 17.9877Z"
													fill="#6B6C76"
												/>
											</svg>
										}
									>
										{proposal.zip}
									</InfoItem>
								) : null}
							</div>
						</div>
					</div>

					<div className={cardClass}>
						<h2 className="mb-4 text-base font-semibold text-accent-foreground">
							{__('Details', 'doublescale')}
						</h2>
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div className="space-y-6">
								<InfoItem
									icon={
										<CalendarIcon width={18} height={18} />
									}
								>
									{__('Date', 'doublescale')}:{' '}
									{proposal.date || '—'}
								</InfoItem>
								<InfoItem
									icon={
										<CurrencyIcon width={18} height={18} />
									}
								>
									{__('Currency', 'doublescale')}:{' '}
									{proposal.currency}
								</InfoItem>
							</div>
							<div className="space-y-3">
								<InfoItem
									icon={
										<CalendarIcon width={18} height={18} />
									}
								>
									{__('Open Till', 'doublescale')}:{' '}
									{proposal.open_till || '—'}
								</InfoItem>
							</div>
						</div>
					</div>
				</div>

				<div className={`${cardClass} space-y-6`}>
					<h2 className="text-base font-semibold text-accent-foreground">
						{__('Items', 'doublescale')}
					</h2>

					<div className="overflow-hidden rounded-lg border border-border bg-white">
						<Table>
							<TableHeader className="bg-[#F8F8F8]">
								<TableRow>
									<TableHead>
										{__('Item', 'doublescale')}
									</TableHead>
									<TableHead>
										{__('Description', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Qty', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Rate', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Amount', 'doublescale')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{lineItems.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="py-8 text-center text-muted-foreground"
										>
											{__(
												'No line items.',
												'doublescale'
											)}
										</TableCell>
									</TableRow>
								) : (
									lineItems.map((item, index) => (
										<TableRow key={index}>
											<TableCell>
												{item.description || '—'}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{item.long_description || '—'}
											</TableCell>
											<TableCell className="text-right">
												{item.qty}
											</TableCell>
											<TableCell className="text-right">
												{formatMoney(
													item.rate,
													proposal.currency
												)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatMoney(
													computeAmount(item),
													proposal.currency
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex justify-end">
						<div className="relative w-full max-w-xs rounded-xl bg-[#D9E9F3] p-4">
							<svg
								className="pointer-events-none absolute inset-0 z-0 h-full w-full text-[#0D9DFC]"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<rect
									x="0.5"
									y="0.5"
									width="calc(100% - 1px)"
									height="calc(100% - 1px)"
									rx="12"
									ry="12"
									fill="none"
									stroke="currentColor"
									strokeWidth="1"
									strokeDasharray="20 14"
									vectorEffect="nonScalingStroke"
								/>
							</svg>
							<div className="relative z-10">
							<div className="flex items-center justify-between text-sm">
								<span className="text-medium text-muted-foreground">
									{__('Subtotal', 'doublescale')}
								</span>
								<span className="text-semibold text-accent-foreground">
									{formatMoney(
										proposal.subtotal,
										proposal.currency
									)}
								</span>
							</div>
							<div className="my-4 border-t border-[#0D9DFC]" />
							<div className="flex items-center justify-between text-sm">
								<span className="text-medium text-muted-foreground">
									{__('Total', 'doublescale')}
								</span>
								<span className="text-base font-semibold text-accent-foreground">
									{formatMoney(
										proposal.total,
										proposal.currency
									)}
								</span>
							</div>
							</div>
						</div>
					</div>
				</div>
					</div>

					<div className="xl:sticky xl:top-4">
						<DocumentEditorSidebar
							docType="proposal"
							templateId={proposal.template}
							templateColor={proposal.template_color ?? null}
							onColorChange={() => {}}
							showStyleEditor={false}
							preview={
								<ProposalDocumentPreview proposal={proposal} />
							}
						/>
					</div>
				</div>
			</div>

			{proposal.has_signature || proposal.signed_name ? (
				<div className="space-y-3 rounded-xl border border-[#DEE1E6] bg-[#F8FAFC] p-5">
					<h2 className="text-base font-semibold text-[#09090B]">
						{__('Signature', 'doublescale')}
					</h2>
					{proposal.signed_name ? (
						<p className="text-sm">
							<span className="text-muted-foreground">
								{__('Signed by', 'doublescale')}:{' '}
							</span>
							<span className="font-medium">
								{proposal.signed_name}
							</span>
						</p>
					) : null}
					{proposal.accepted_at ? (
						<p className="text-sm text-muted-foreground">
							{__('Accepted at', 'doublescale')}:{' '}
							{proposal.accepted_at}
						</p>
					) : null}
					{signatureLoading ? (
						<p className="text-sm text-muted-foreground">
							{__('Loading signature…', 'doublescale')}
						</p>
					) : signatureError ? (
						<p className="text-sm text-red-600">{signatureError}</p>
					) : signature?.signature ? (
						<div className="inline-block max-w-full rounded border bg-white p-4">
							<img
								src={signature.signature}
								alt={__('Customer signature', 'doublescale')}
								className="max-h-40 max-w-full"
							/>
						</div>
					) : proposal.has_signature ? (
						<p className="text-sm text-muted-foreground">
							{__('Signature on file.', 'doublescale')}
						</p>
					) : null}
				</div>
			) : null}

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Proposal', 'doublescale')}
				description={__(
					'Do you really want to delete this proposal?',
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
				icon={<GradientProposalsIcon width={32} height={32} />}
				title={__('Send Proposal', 'doublescale')}
				description={__(
					'Send this proposal to the customer by email? They will receive a link to view, accept, or decline.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busy}
				onConfirm={handleSend}
			/>

			<ConvertToInvoiceDialog
				open={convertOpen}
				onOpenChange={setConvertOpen}
				description={convertWarning}
				busy={busy}
				onConfirm={handleConvert}
			/>

			<ConfirmDialog
				open={markAcceptedOpen}
				onOpenChange={setMarkAcceptedOpen}
				title={__('Mark as Accepted', 'doublescale')}
				description={__(
					'Mark this proposal as accepted on the customer’s behalf? This may create a draft invoice automatically.',
					'doublescale'
				)}
				confirmLabel={__('Mark as Accepted', 'doublescale')}
				busy={busy}
				onConfirm={handleMarkAccepted}
			/>

			{proposal ? (
				<ProposalFormDialog
					open={editOpen}
					onOpenChange={setEditOpen}
					proposalId={proposal.id}
					onSaved={() => {
						void refetch();
						setEditOpen(false);
					}}
				/>
			) : null}
		</div>
	);
};

export default ProposalView;
