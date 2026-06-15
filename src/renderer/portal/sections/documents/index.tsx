/**
 * Documents section — the customer's invoices and proposals (All / Invoices /
 * Proposals tabs). Phase 1 is link-out: each row opens the existing public hash
 * page (`public_url`) in a new tab for the heavy actions (view / pay / accept /
 * decline / sign / download PDF). The portal never reimplements those flows, so
 * the Free→Pro payment seam stays on the public page (see docs/portal-documents-plan.md).
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';

import { fetchDocuments, useAsync, type DocumentFilter } from '../../api';
import type { PortalDocument } from '../../types';
import { formatDate, formatMoney } from '../../shared/format';
import { DocumentIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

const TABS: Array<{ key: DocumentFilter; label: string }> = [
	{ key: 'all', label: __('All', 'doublescale') },
	{ key: 'invoice', label: __('Invoices', 'doublescale') },
	{ key: 'proposal', label: __('Proposals', 'doublescale') },
];

const isPayable = (doc: PortalDocument): boolean =>
	doc.type === 'invoice' && doc.balance !== null && doc.balance > 0;

const DocumentRow = ({ doc }: { doc: PortalDocument }) => {
	const isInvoice = doc.type === 'invoice';
	const title = isInvoice ? doc.number : doc.subject || doc.number;
	const dueValue = isInvoice ? doc.due_date : doc.open_till;

	return (
		<div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
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
						{isInvoice
							? sprintf(
									// translators: %s is the invoice number.
									__('Invoice · %s', 'doublescale'),
									doc.number
							  )
							: __('Proposal', 'doublescale')}
					</p>
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
						{doc.date && <span>{formatDate(doc.date)}</span>}
						<span className="font-medium text-foreground">
							{formatMoney(doc.total, doc.currency)}
						</span>
						{isInvoice && doc.balance !== null && doc.balance > 0 && (
							<span className={doc.is_overdue ? 'font-medium text-red-600' : ''}>
								{sprintf(
									// translators: %s is the outstanding balance amount.
									__('Balance: %s', 'doublescale'),
									formatMoney(doc.balance, doc.currency)
								)}
							</span>
						)}
						{dueValue && (
							<span>
								{isInvoice
									? __('Due', 'doublescale')
									: __('Valid until', 'doublescale')}
								: {formatDate(dueValue)}
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="shrink-0">
				{doc.public_url ? (
					<Button
						variant="outline"
						onClick={() =>
							window.open(doc.public_url, '_blank', 'noopener,noreferrer')
						}
					>
						{isPayable(doc)
							? __('View & pay', 'doublescale')
							: __('View', 'doublescale')}
					</Button>
				) : (
					<span className="text-xs text-muted-foreground">
						{__('Unavailable', 'doublescale')}
					</span>
				)}
			</div>
		</div>
	);
};

const Documents = () => {
	const [filter, setFilter] = useState<DocumentFilter>('all');
	const { data, loading, error } = useAsync(() => fetchDocuments(filter), [
		filter,
	]);
	const docs = data?.data || [];

	return (
		<section>
			<h2 className="mb-4 text-xl font-bold">
				{__('Documents', 'doublescale')}
			</h2>

			<div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setFilter(tab.key)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							filter === tab.key
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && docs.length === 0 && (
				<EmptyState
					title={__('No documents yet', 'doublescale')}
					description={__(
						'Your invoices and proposals will appear here.',
						'doublescale'
					)}
				/>
			)}
			{!loading && !error && docs.length > 0 && (
				<div className="space-y-3">
					{docs.map((doc) => (
						<DocumentRow key={`${doc.type}-${doc.id}`} doc={doc} />
					))}
				</div>
			)}
		</section>
	);
};

export default Documents;
