/**
 * Documents section — the customer's invoices, proposals, contracts, and payment history.
 *
 * Tabs: All / Invoices / Proposals / Contracts / Payments. Clicking a document opens it
 * INLINE via the Free public renderers (invoice, proposal, contract).
 */

import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Link,
	Navigate,
	Route,
	Routes,
	useNavigate,
	useParams,
} from 'react-router-dom';

import PublicContractApp from '../../../contract/app';
import PublicInvoiceApp from '../../../invoice/app';
import PublicProposalApp from '../../../proposal/app';
import PortalCreditNoteDetail from '@doublescale-pro/portal-credit-note-detail';

import { fetchDocuments, fetchPayments, useAsync, type DocumentFilter } from '../../api';
import {
	isCreditNotesPortalModuleEnabled,
	isCreditNotesPortalProActive,
} from '../../credit-notes';
import CreditNotesPortalProGate from '../../credit-note-pro-gate';
import type { PortalDocument, PortalPayment } from '../../types';
import { formatDate, formatMoney } from '../../shared/format';
import { ChevronLeftIcon, DocumentIcon, PaymentIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

/** Document filter tabs plus the consolidated payment-history view. */
type DocTab = DocumentFilter | 'payments';

const BASE_TABS: Array<{ key: Exclude<DocTab, 'credit_note'>; label: string }> = [
	{ key: 'all', label: __('All', 'doublescale') },
	{ key: 'invoice', label: __('Invoices', 'doublescale') },
	{ key: 'proposal', label: __('Proposals', 'doublescale') },
	{ key: 'contract', label: __('Contracts', 'doublescale') },
];

const PAYMENTS_TAB = { key: 'payments' as const, label: __('Payments', 'doublescale') };
const CREDIT_NOTES_TAB = {
	key: 'credit_note' as const,
	label: __('Credit Notes', 'doublescale'),
};

const documentRouteSegment = (type: PortalDocument['type']): string =>
	type === 'credit_note' ? 'credit-note' : type;

const isPayable = (doc: PortalDocument): boolean =>
	doc.type === 'invoice' && doc.balance !== null && doc.balance > 0;

const isSignable = (doc: PortalDocument): boolean =>
	doc.type === 'contract' &&
	doc.status === 'sent' &&
	!doc.is_expired;

const documentTypeLabel = (doc: PortalDocument): string => {
	if (doc.type === 'invoice') {
		return sprintf(
			/* translators: %s is the invoice number. */
			__('Invoice · %s', 'doublescale'),
			doc.number
		);
	}
	if (doc.type === 'contract') {
		return sprintf(
			/* translators: %s is the contract number. */
			__('Contract · %s', 'doublescale'),
			doc.number
		);
	}
	if (doc.type === 'credit_note') {
		return sprintf(
			/* translators: %s is the credit note number. */
			__('Credit note · %s', 'doublescale'),
			doc.number
		);
	}
	return __('Proposal', 'doublescale');
};

const DocumentRow = ({ doc }: { doc: PortalDocument }) => {
	const isInvoice = doc.type === 'invoice';
	const isContract = doc.type === 'contract';
	const isCreditNote = doc.type === 'credit_note';
	const title =
		isInvoice || isCreditNote ? doc.number : doc.subject || doc.number;
	const endDate = isInvoice ? doc.due_date : doc.open_till;

	return (
		<Link
			to={`${documentRouteSegment(doc.type)}/${doc.hash}`}
			className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
		>
			<div className="flex min-w-0 items-start gap-3">
				<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
					<DocumentIcon className="h-5 w-5" />
				</span>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<p className="truncate font-semibold text-foreground">{title}</p>
						<StatusBadge status={doc.status} />
					</div>
					<p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
						{documentTypeLabel(doc)}
					</p>
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
						{doc.date && <span>{formatDate(doc.date)}</span>}
						<span className="font-medium text-foreground">
							{formatMoney(doc.total, doc.currency)}
						</span>
						{isInvoice && doc.amount_paid !== null && doc.amount_paid > 0 && (
							<span className="text-green-600">
								{sprintf(
									/* translators: %s is the amount paid so far. */
									__('Paid: %s', 'doublescale'),
									formatMoney(doc.amount_paid, doc.currency)
								)}
							</span>
						)}
						{isInvoice && doc.balance !== null && doc.balance > 0 && (
							<span className={doc.is_overdue ? 'font-medium text-red-600' : ''}>
								{sprintf(
									/* translators: %s is the outstanding balance amount. */
									__('Balance: %s', 'doublescale'),
									formatMoney(doc.balance, doc.currency)
								)}
							</span>
						)}
						{isCreditNote && doc.amount_paid !== null && doc.amount_paid > 0 && (
							<span className="text-green-600">
								{sprintf(
									/* translators: %s is the amount applied so far. */
									__('Applied: %s', 'doublescale'),
									formatMoney(doc.amount_paid, doc.currency)
								)}
							</span>
						)}
						{isCreditNote && doc.balance !== null && doc.balance > 0 && (
							<span>
								{sprintf(
									/* translators: %s is the remaining credit amount. */
									__('Remaining: %s', 'doublescale'),
									formatMoney(doc.balance, doc.currency)
								)}
							</span>
						)}
						{endDate && (
							<span>
								{isInvoice
									? __('Due', 'doublescale')
									: isContract
									? __('Ends', 'doublescale')
									: __('Valid until', 'doublescale')}
								: {formatDate(endDate)}
							</span>
						)}
					</div>
				</div>
			</div>

			<span className="shrink-0 text-sm font-medium text-primary">
				{isPayable(doc)
					? __('View & pay', 'doublescale')
					: isSignable(doc)
					? __('View & sign', 'doublescale')
					: __('View', 'doublescale')}
			</span>
		</Link>
	);
};

const DocumentsList = ({ filter }: { filter: DocumentFilter }) => {
	const { data, loading, error } = useAsync(() => fetchDocuments(filter), [
		filter,
	]);
	const docs = data?.data || [];

	if (loading) {
		return <Spinner />;
	}
	if (error) {
		return <ErrorState message={error} />;
	}
	if (docs.length === 0) {
		return (
			<EmptyState
				title={__('No documents yet', 'doublescale')}
				description={__(
					'Your invoices, proposals, and contracts will appear here.',
					'doublescale'
				)}
			/>
		);
	}

	return (
		<div className="space-y-3">
			{docs.map((doc) => (
				<DocumentRow key={`${doc.type}-${doc.id}`} doc={doc} />
			))}
		</div>
	);
};

const PaymentRow = ({ payment }: { payment: PortalPayment }) => (
	<Link
		to={`invoice/${payment.invoice_hash}`}
		className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
	>
		<div className="flex min-w-0 items-start gap-3">
			<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
				<PaymentIcon className="h-5 w-5" />
			</span>
			<div className="min-w-0">
				<p className="text-lg font-semibold text-foreground">
					{formatMoney(payment.amount, payment.currency)}
				</p>
				<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
					{payment.payment_date && (
						<span>{formatDate(payment.payment_date)}</span>
					)}
					{payment.payment_mode && (
						<span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
							{payment.payment_mode.replace(/_/g, ' ')}
						</span>
					)}
					<span>
						{sprintf(
							/* translators: %s is the invoice number. */
							__('Invoice %s', 'doublescale'),
							payment.invoice_number
						)}
					</span>
				</div>
			</div>
		</div>
		<span className="shrink-0 text-sm font-medium text-primary">
			{__('View invoice', 'doublescale')}
		</span>
	</Link>
);

const PaymentsList = () => {
	const { data, loading, error } = useAsync(() => fetchPayments(), []);
	const payments = data?.data || [];

	if (loading) {
		return <Spinner />;
	}
	if (error) {
		return <ErrorState message={error} />;
	}
	if (payments.length === 0) {
		return (
			<EmptyState
				title={__('No payments yet', 'doublescale')}
				description={__(
					'Payments you make on your invoices will appear here.',
					'doublescale'
				)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{data && data.total_paid > 0 && (
				<div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 shadow-sm">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{__('Total paid', 'doublescale')}
					</p>
					<p className="mt-1 text-3xl font-bold text-foreground">
						{formatMoney(data.total_paid, data.currency)}
					</p>
				</div>
			)}

			<div className="space-y-3">
				{payments.map((payment) => (
					<PaymentRow key={payment.id} payment={payment} />
				))}
			</div>
		</div>
	);
};

const DocumentsHome = () => {
	const [tab, setTab] = useState<DocTab>('all');
	const creditNotesEnabled = isCreditNotesPortalModuleEnabled();
	const creditNotesPro = isCreditNotesPortalProActive();

	const tabs = useMemo(() => {
		const items: Array<{ key: DocTab; label: string }> = [...BASE_TABS];
		if (creditNotesEnabled) {
			items.push(CREDIT_NOTES_TAB);
		}
		items.push(PAYMENTS_TAB);
		return items;
	}, [creditNotesEnabled]);

	return (
		<section>
			<h2 className="mb-4 text-xl font-bold">
				{__('Documents', 'doublescale')}
			</h2>

			<div className="mb-4 inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
				{tabs.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							tab === t.key
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === 'payments' ? (
				<PaymentsList />
			) : tab === 'credit_note' && creditNotesEnabled && !creditNotesPro ? (
				<CreditNotesPortalProGate />
			) : (
				<DocumentsList filter={tab} />
			)}
		</section>
	);
};

const BackLink = () => {
	const navigate = useNavigate();
	return (
		<button
			type="button"
			onClick={() => navigate('/documents')}
			className="mb-4 inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground"
		>
			<ChevronLeftIcon className="h-4 w-4" />
			{__('Back to documents', 'doublescale')}
		</button>
	);
};

const DocumentDetailFrame = ({
	children,
}: {
	children: React.ReactNode;
}) => (
	<section>
		<BackLink />
		<div className="min-w-0">{children}</div>
	</section>
);

const InvoiceDetail = () => {
	const { hash } = useParams();
	return (
		<DocumentDetailFrame>
			{hash ? (
				<PublicInvoiceApp hash={hash} />
			) : (
				<ErrorState message={__('Invoice not found.', 'doublescale')} />
			)}
		</DocumentDetailFrame>
	);
};

const ProposalDetail = () => {
	const { hash } = useParams();
	return (
		<DocumentDetailFrame>
			{hash ? (
				<PublicProposalApp hash={hash} />
			) : (
				<ErrorState message={__('Proposal not found.', 'doublescale')} />
			)}
		</DocumentDetailFrame>
	);
};

const ContractDetail = () => {
	const { hash } = useParams();
	return (
		<DocumentDetailFrame>
			{hash ? (
				<PublicContractApp hash={hash} />
			) : (
				<ErrorState message={__('Contract not found.', 'doublescale')} />
			)}
		</DocumentDetailFrame>
	);
};

const CreditNoteDetail = () => {
	const { hash } = useParams();
	return (
		<DocumentDetailFrame>
			{hash ? (
				<PortalCreditNoteDetail hash={hash} />
			) : (
				<ErrorState message={__('Credit note not found.', 'doublescale')} />
			)}
		</DocumentDetailFrame>
	);
};

const Documents = () => (
	<Routes>
		<Route index element={<DocumentsHome />} />
		<Route path="invoice/:hash" element={<InvoiceDetail />} />
		<Route path="proposal/:hash" element={<ProposalDetail />} />
		<Route path="contract/:hash" element={<ContractDetail />} />
		<Route path="credit-note/:hash" element={<CreditNoteDetail />} />
		<Route path="*" element={<Navigate to="" replace />} />
	</Routes>
);

export default Documents;
