/**
 * Documents section — card grid for invoices, proposals, contracts, credit notes,
 * and payments, with search, categorized status filter, and empty states.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import type { ReactNode } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Search,
} from 'lucide-react';
import {
	Link,
	Navigate,
	Route,
	Routes,
	useNavigate,
	useParams,
} from 'react-router-dom';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
	CONTRACT_STATUS_LABELS,
	CONTRACT_STATUSES,
	INVOICE_STATUS_LABELS,
	INVOICE_STATUSES,
	PROPOSAL_STATUS_LABELS,
	PROPOSAL_STATUSES,
	type ContractStatus,
	type InvoiceStatus,
	type ProposalStatus,
} from '@/constants/sales';
import {
	ContractStatusPill,
	InvoiceStatusPill,
	ProposalStatusPill,
} from '@/components/sales';
import {
	AppliedCreditIcon,
	CategoryIcon,
	ContractDraftIcon,
	DollerIcon,
	DownloadIcon,
	EmptyPaymentsIcon,
	GradientContractsIcon,
	GradientDocumentsIcon,
	GradientProposalsIcon,
	InvoicesIcon,
	NoCreditNoteIcon,
	NovicesIcon,
	PaidAppliedIcon,
	PaymentModeIcon,
	ProposalsIcon,
	TotalCreditedIcon,
	ViewIcon,
} from '@doublescale/components';

import PublicContractApp from '../../../contract/app';
import { getPublicContractPdfUrl } from '../../../contract/public-api';
import PublicInvoiceApp from '../../../invoice/app';
import { getPublicInvoicePdfUrl } from '../../../invoice/public-api';
import PublicProposalApp from '../../../proposal/app';
import { getPublicProposalPdfUrl } from '../../../proposal/public-api';
import PortalCreditNoteDetail from '@doublescale-pro/portal-credit-note-detail';

import {
	fetchDocuments,
	fetchPayments,
	useAsync,
	type DocumentFilter,
} from '../../api';
import { getPortalConfig } from '../../config';
import {
	isContractsPortalModuleEnabled,
	isContractsPortalProActive,
} from '../../contracts';
import ContractsPortalProGate from '../../contract-pro-gate';
import {
	isCreditNotesPortalModuleEnabled,
	isCreditNotesPortalProActive,
} from '../../credit-notes';
import CreditNotesPortalProGate from '../../credit-note-pro-gate';
import { isInvoicesPaymentsPortalProActive } from '../../invoices-payments';
import InvoicePaymentsPortalProGate from '../../invoice-payments-pro-gate';
import type { PortalDocument, PortalPayment } from '../../types';
import { formatDate } from '../../shared/format';
import { ChevronLeftIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';

type DocTab = DocumentFilter | 'payments';

const PAGE_SIZE = 6;
const META_ICON_SIZE = 24;
const HEADER_ICON_SIZE = 24;
const ACTION_ICON_SIZE = 18;

type DocumentListItem =
	| { kind: 'document'; doc: PortalDocument; sortDate: string }
	| { kind: 'payment'; payment: PortalPayment; sortDate: string };

const CREDIT_NOTE_STATUSES = [
	'draft',
	'open',
	'partially_applied',
	'applied',
	'void',
] as const;

const CREDIT_NOTE_STATUS_LABELS: Record<string, string> = {
	draft: __('Draft', 'doublescale'),
	open: __('Open', 'doublescale'),
	partially_applied: __('Partially Applied', 'doublescale'),
	applied: __('Applied', 'doublescale'),
	void: __('Void', 'doublescale'),
};

const CREDIT_NOTE_STATUS_CLASSES: Record<string, string> = {
	draft: 'bg-[#ECECEC] text-[#6B6C76]',
	open: 'bg-[#E4F0FA] text-[#0D9DFC]',
	partially_applied: 'bg-[#F7F4C3] text-[#896900]',
	applied: 'bg-[#E4FAEC] text-[#16A34A]',
	void: 'bg-[#FBE8E8] text-[#C30A0A]',
};

const CreditNoteStatusPill = ({ status }: { status: string }) => (
	<span
		className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
			CREDIT_NOTE_STATUS_CLASSES[status] || CREDIT_NOTE_STATUS_CLASSES.draft
		}`}
	>
		{CREDIT_NOTE_STATUS_LABELS[status] || status.replace(/_/g, ' ')}
	</span>
);

const documentStatusPill = (doc: PortalDocument): ReactNode => {
	if (doc.type === 'invoice') {
		return <InvoiceStatusPill status={doc.status as InvoiceStatus} />;
	}
	if (doc.type === 'proposal') {
		return (
			<ProposalStatusPill
				status={doc.status as ProposalStatus}
				expired={doc.is_expired}
			/>
		);
	}
	if (doc.type === 'contract') {
		return (
			<ContractStatusPill
				status={doc.status as ContractStatus}
				expired={doc.is_expired || doc.status === 'expired'}
			/>
		);
	}
	if (doc.type === 'credit_note') {
		return <CreditNoteStatusPill status={doc.status} />;
	}
	return null;
};

type StatusGroupKey = 'invoice' | 'proposal' | 'contract' | 'credit_note';

type StatusGroup = {
	key: StatusGroupKey;
	label: string;
	statuses: Array<{ value: string; label: string }>;
};

const STATUS_GROUPS: StatusGroup[] = [
	{
		key: 'invoice',
		label: __('Invoices', 'doublescale'),
		statuses: INVOICE_STATUSES.map((value) => ({
			value,
			label: INVOICE_STATUS_LABELS[value],
		})),
	},
	{
		key: 'proposal',
		label: __('Proposals', 'doublescale'),
		statuses: PROPOSAL_STATUSES.map((value) => ({
			value,
			label: PROPOSAL_STATUS_LABELS[value],
		})),
	},
	{
		key: 'contract',
		label: __('Contracts', 'doublescale'),
		statuses: CONTRACT_STATUSES.map((value) => ({
			value,
			label: CONTRACT_STATUS_LABELS[value],
		})),
	},
	{
		key: 'credit_note',
		label: __('Credit Notes', 'doublescale'),
		statuses: CREDIT_NOTE_STATUSES.map((value) => ({
			value,
			label: CREDIT_NOTE_STATUS_LABELS[value],
		})),
	},
];

const CARD_THEME: Record<
	PortalDocument['type'] | 'payment',
	{
		borderTop: string;
		header: string;
		title: string;
		subtitle: string;
		iconWrap: string;
	}
> = {
	invoice: {
		borderTop: 'border-t-[#008230]',
		header: 'bg-[#E4FAEC]',
		title: 'text-[#008230]',
		subtitle: 'text-[#008230]/80',
		iconWrap: 'text-[#008230]',
	},
	proposal: {
		borderTop: 'border-t-[#0266A8]',
		header: 'bg-[#D9E9F3]',
		title: 'text-[#0266A8]',
		subtitle: 'text-[#0266A8]/80',
		iconWrap: 'text-[#0266A8]',
	},
	contract: {
		borderTop: 'border-t-primary',
		header: 'bg-[#EEEEFF]',
		title: 'text-primary',
		subtitle: 'text-primary/80',
		iconWrap: 'text-primary',
	},
	credit_note: {
		borderTop: 'border-t-[#CB5301]',
		header: 'bg-[#FFF4ED]',
		title: 'text-[#CB5301]',
		subtitle: 'text-[#CB5301]/80',
		iconWrap: 'text-[#CB5301]',
	},
	payment: {
		borderTop: 'border-t-[#896900]',
		header: 'bg-[#F7F4C3]',
		title: 'text-[#896900]',
		subtitle: 'text-[#896900]/80',
		iconWrap: 'text-[#896900]',
	},
};

const documentRouteSegment = (type: PortalDocument['type']): string =>
	type === 'credit_note' ? 'credit-note' : type;

const typeLabel = (type: PortalDocument['type'] | 'payment'): string => {
	switch (type) {
		case 'invoice':
			return __('Invoice', 'doublescale');
		case 'proposal':
			return __('Proposal', 'doublescale');
		case 'contract':
			return __('Contract', 'doublescale');
		case 'credit_note':
			return __('Credit note', 'doublescale');
		case 'payment':
			return __('Payment', 'doublescale');
		default:
			return __('Document', 'doublescale');
	}
};

const formatCardMoney = (
	amount: string | number | null | undefined,
	currency?: string | null
): string => {
	if (amount === null || amount === undefined || amount === '') {
		return '—';
	}
	const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
	if (Number.isNaN(num)) {
		return String(amount);
	}
	const formattedNum = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
	const code = (currency || '').trim().toUpperCase();
	// Match portal mockups: "330 $" (USD uses $, other codes stay as-is).
	const suffix = !code || code === 'USD' ? '$' : code;
	return `${formattedNum} ${suffix}`;
};

const getDocumentPdfUrl = (doc: PortalDocument): string | null => {
	if (!doc.hash) {
		return null;
	}
	try {
		if (doc.type === 'invoice') {
			return getPublicInvoicePdfUrl(doc.hash);
		}
		if (doc.type === 'proposal') {
			return getPublicProposalPdfUrl(doc.hash);
		}
		if (doc.type === 'contract') {
			return getPublicContractPdfUrl(doc.hash);
		}
		if (doc.type === 'credit_note') {
			const base =
				getPortalConfig()?.credit_note_public_rest_url ||
				'/wp-json/doublescale/v1/sales/public/credit-notes';
			return `${base.replace(/\/$/, '')}/${doc.hash}/pdf`;
		}
	} catch {
		return null;
	}
	return null;
};

const documentCardIcon = (type: PortalDocument['type'], size = HEADER_ICON_SIZE): ReactNode => {
	switch (type) {
		case 'invoice':
			return <InvoicesIcon width={size} height={size} color="currentColor" />;
		case 'proposal':
			return <ProposalsIcon width={size} height={size} color="currentColor" />;
		case 'contract':
			return <ContractDraftIcon width={size} height={size} />;
		case 'credit_note':
			return <TotalCreditedIcon width={size} height={size} color="currentColor" />;
		default:
			return <InvoicesIcon width={size} height={size} color="currentColor" />;
	}
};

/** Soft purple plate used around category empty icons (matches portal mockups). */
const emptyIconPlate = (icon: ReactNode): ReactNode => (
	<span className="inline-flex h-16 w-16 items-center justify-center">
		{icon}
	</span>
);

const emptyCopy = (
	tab: DocTab
): { title: string; description: string; icon: ReactNode } => {
	const iconSize = 40;
	switch (tab) {
		case 'invoice':
			return {
				title: __('No invoices yet', 'doublescale'),
				description: __(
					'There are no invoices to display at the moment.',
					'doublescale'
				),
				icon: emptyIconPlate(
					<NovicesIcon width={iconSize} height={iconSize} />
				),
			};
		case 'proposal':
			return {
				title: __('No proposals yet', 'doublescale'),
				description: __(
					'There are no proposals to display at the moment.',
					'doublescale'
				),
				icon: emptyIconPlate(
					<GradientProposalsIcon width={iconSize} height={iconSize} />
				),
			};
		case 'contract':
			return {
				title: __('No contracts yet', 'doublescale'),
				description: __(
					'There are no contracts to display at the moment.',
					'doublescale'
				),
				icon: emptyIconPlate(
					<GradientContractsIcon width={iconSize} height={iconSize} />
				),
			};
		case 'credit_note':
			return {
				title: __('No credit notes yet', 'doublescale'),
				description: __(
					'There are no credit notes to display at the moment.',
					'doublescale'
				),
				icon: emptyIconPlate(
					<NoCreditNoteIcon width={iconSize} height={iconSize} />
				),
			};
		case 'payments':
			return {
				title: __('No payments yet', 'doublescale'),
				description: __(
					'There are no payments to display at the moment.',
					'doublescale'
				),
				icon: emptyIconPlate(
					<EmptyPaymentsIcon width={iconSize} height={iconSize} />
				),
			};
		default:
			return {
				title: __('No documents yet', 'doublescale'),
				description: __(
					'There are no documents to display at the moment.',
					'doublescale'
				),
				icon: <GradientDocumentsIcon width={70} height={70} />,
			};
	}
};

const MetaCell = ({
	icon,
	label,
	value,
	danger = false,
}: {
	icon: ReactNode;
	label: string;
	value: string;
	danger?: boolean;
}) => (
	<div className="min-w-0">
		<div
			className={`flex items-center gap-2 text-xs ${
				danger ? 'text-destructive' : 'text-muted-foreground'
			}`}
		>
			<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center [&_svg]:h-6 [&_svg]:w-6">
				{icon}
			</span>
			<span>{label}</span>
		</div>
		<p
			className={`mt-1.5 truncate text-sm font-semibold ${
				danger ? 'text-destructive' : 'text-foreground'
			}`}
		>
			{value}
		</p>
	</div>
);

/** Always reserves two meta rows so every details card matches height. */
const MetaGrid = ({ children }: { children: ReactNode }) => (
	<div className="grid min-h-[7.75rem] grid-cols-2 grid-rows-2 content-start gap-x-4 gap-y-4">
		{children}
	</div>
);

const DocumentCardShell = ({
	theme,
	headerIcon,
	title,
	subtitle,
	status,
	amount,
	meta,
	footer,
}: {
	theme: (typeof CARD_THEME)[keyof typeof CARD_THEME];
	headerIcon: ReactNode;
	title: string;
	subtitle: string;
	status?: ReactNode;
	amount: string;
	meta: ReactNode;
	footer: ReactNode;
}) => (
	<div
		className={`flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#E8E8ED] border-t-4 bg-[#F7F8FA] ${theme.borderTop}`}
	>
		<div className={`mb-2 shrink-0 px-4 pb-2 pt-4 ${theme.header}`}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-start gap-1.5">
					<span
						className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${theme.iconWrap}`}
					>
						{headerIcon}
					</span>
					<div className="min-w-0">
						<p className={`truncate text-sm font-semibold ${theme.title}`}>
							{title}
						</p>
						<p className={`mt-0.5 text-xs ${theme.subtitle}`}>
							{subtitle}
						</p>
					</div>
				</div>
				{status}
			</div>
		</div>

		<div className="flex min-h-0 flex-1 flex-col px-4">
			<div
				className="flex flex-1 flex-col rounded-xl border-0 bg-white p-4"
				style={{
					boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.14)',
				}}
			>
				<p className="text-[28px] font-bold leading-tight text-foreground">
					{amount}
				</p>
				{meta ? (
					<>
						<div className="my-4 h-px shrink-0 bg-border" />
						<div className="min-h-0 flex-1">{meta}</div>
					</>
				) : null}
			</div>
		</div>

		<div className="mt-4 flex shrink-0 gap-2 px-4 pb-4">{footer}</div>
	</div>
);

const DocumentsPagination = ({
	page,
	totalPages,
	onPageChange,
}: {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}) => {
	if (totalPages <= 1) {
		return null;
	}
	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<div className="mt-6 flex items-center justify-center gap-2">
			<button
				type="button"
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground disabled:opacity-40"
				aria-label={__('Previous page', 'doublescale')}
			>
				<ChevronLeft width={16} height={16} />
			</button>
			{pages.map((p) => (
				<button
					key={p}
					type="button"
					onClick={() => onPageChange(p)}
					className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
						p === page
							? 'bg-primary text-white'
							: 'border border-border bg-white text-foreground'
					}`}
				>
					{p}
				</button>
			))}
			<button
				type="button"
				onClick={() => onPageChange(page + 1)}
				disabled={page >= totalPages}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground disabled:opacity-40"
				aria-label={__('Next page', 'doublescale')}
			>
				<ChevronRight width={16} height={16} />
			</button>
		</div>
	);
};

/** Date icon from booking details modal (calendar with checkmark). */
const DocumentDateIcon = ({
	width = META_ICON_SIZE,
	height = META_ICON_SIZE,
}: {
	width?: number;
	height?: number;
}) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={width}
		height={height}
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden
	>
		<path
			d="M15.3794 4.91172V3.62069C15.3794 3.28138 15.098 3 14.7587 3C14.4194 3 14.138 3.28138 14.138 3.62069V4.86207H8.75871V3.62069C8.75871 3.28138 8.47733 3 8.13802 3C7.79871 3 7.51733 3.28138 7.51733 3.62069V4.91172C5.28285 5.11862 4.19871 6.45103 4.03319 8.42897C4.01664 8.66897 4.21526 8.86759 4.44699 8.86759H18.4497C18.6897 8.86759 18.8883 8.66069 18.8635 8.42897C18.698 6.45103 17.6139 5.11862 15.3794 4.91172Z"
			fill="currentColor"
		/>
		<path
			opacity="0.4"
			d="M18.8966 10.9365V12.3765C18.8966 12.8813 18.4497 13.2703 17.9531 13.1875C17.7214 13.1544 17.4814 13.1296 17.2414 13.1296C14.7338 13.1296 12.6897 15.1737 12.6897 17.6813C12.6897 18.062 12.8386 18.5916 12.9959 19.0716C13.1779 19.6096 12.7807 20.1641 12.2097 20.1641H8.13793C5.24138 20.1641 4 18.5089 4 16.0261V10.9282C4 10.473 4.37241 10.1006 4.82759 10.1006H18.069C18.5241 10.1089 18.8966 10.4813 18.8966 10.9365Z"
			fill="currentColor"
		/>
		<path
			d="M17.241 14.3794C15.412 14.3794 13.9307 15.8608 13.9307 17.6897C13.9307 18.3104 14.1045 18.898 14.4107 19.3946C14.9817 20.3546 16.0327 21.0001 17.241 21.0001C18.4493 21.0001 19.5003 20.3546 20.0714 19.3946C20.3776 18.898 20.5514 18.3104 20.5514 17.6897C20.5514 15.8608 19.07 14.3794 17.241 14.3794ZM18.9541 17.3339L17.1914 18.9642C17.0755 19.0718 16.9183 19.1297 16.7693 19.1297C16.612 19.1297 16.4548 19.0718 16.3307 18.9477L15.5114 18.1284C15.2714 17.8884 15.2714 17.4911 15.5114 17.2511C15.7514 17.0111 16.1486 17.0111 16.3886 17.2511L16.7858 17.6484L18.11 16.4235C18.3582 16.1918 18.7555 16.2084 18.9872 16.4566C19.2189 16.7049 19.2024 17.0939 18.9541 17.3339Z"
			fill="currentColor"
		/>
		<path
			d="M8.5522 14.38C8.33702 14.38 8.12185 14.289 7.96461 14.14C7.81564 13.9828 7.72461 13.7676 7.72461 13.5524C7.72461 13.3373 7.81564 13.1221 7.96461 12.9649C8.15495 12.7745 8.44461 12.6835 8.71771 12.7414C8.76737 12.7497 8.81702 12.7662 8.86668 12.7911C8.91633 12.8076 8.96599 12.8324 9.01564 12.8655C9.05702 12.8986 9.0984 12.9317 9.13978 12.9649C9.28875 13.1221 9.37978 13.3373 9.37978 13.5524C9.37978 13.7676 9.28875 13.9828 9.13978 14.14C9.0984 14.1731 9.05702 14.2062 9.01564 14.2393C8.96599 14.2724 8.91633 14.2973 8.86668 14.3138C8.81702 14.3386 8.76737 14.3552 8.71771 14.3635C8.65978 14.3717 8.60185 14.38 8.5522 14.38Z"
			fill="currentColor"
		/>
		<path
			d="M11.4487 14.3787C11.2335 14.3787 11.0183 14.2877 10.8611 14.1387C10.7121 13.9815 10.6211 13.7663 10.6211 13.5511C10.6211 13.336 10.7121 13.1208 10.8611 12.9635C11.1756 12.6573 11.7301 12.6573 12.0363 12.9635C12.1852 13.1208 12.2763 13.336 12.2763 13.5511C12.2763 13.7663 12.1852 13.9815 12.0363 14.1387C11.879 14.2877 11.6639 14.3787 11.4487 14.3787Z"
			fill="currentColor"
		/>
		<path
			d="M8.5522 17.2763C8.33702 17.2763 8.12185 17.1853 7.96461 17.0363C7.81564 16.8791 7.72461 16.6639 7.72461 16.4487C7.72461 16.2335 7.81564 16.0185 7.96461 15.8612C8.04737 15.7867 8.13013 15.7287 8.23771 15.6873C8.54392 15.5549 8.90806 15.6295 9.13978 15.8612C9.28875 16.0185 9.37978 16.2335 9.37978 16.4487C9.37978 16.6639 9.28875 16.8791 9.13978 17.0363C8.98254 17.1853 8.76737 17.2763 8.5522 17.2763Z"
			fill="currentColor"
		/>
	</svg>
);

const metaDateIcon = () => <DocumentDateIcon />;

const metaDollarIcon = () => (
	<DollerIcon
		width={META_ICON_SIZE}
		height={META_ICON_SIZE}
		color="currentColor"
	/>
);

const metaPaidIcon = () => (
	<PaidAppliedIcon
		width={META_ICON_SIZE}
		height={META_ICON_SIZE}
		color="currentColor"
	/>
);

const metaPaymentMethodIcon = () => (
	<PaymentModeIcon
		width={META_ICON_SIZE}
		height={META_ICON_SIZE}
		color="currentColor"
	/>
);

const StatusOptionCheckbox = ({
	checked,
	label,
	onToggle,
}: {
	checked: boolean;
	label: string;
	onToggle: () => void;
}) => (
	<button
		type="button"
		className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
		onClick={onToggle}
	>
		<Checkbox
			checked={checked}
			tabIndex={-1}
			className="pointer-events-none"
			aria-hidden
		/>
		{label}
	</button>
);

const StatusFilterSelect = ({
	tab,
	selected,
	onChange,
	groups,
}: {
	tab: DocTab;
	selected: string[];
	onChange: (next: string[]) => void;
	groups: StatusGroup[];
}) => {
	const visibleGroups =
		tab === 'all' || tab === 'payments'
			? groups
			: groups.filter((g) => g.key === tab);

	const label =
		selected.length === 0
			? __('All Status', 'doublescale')
			: selected.length === 1
				? visibleGroups
						.flatMap((g) => g.statuses)
						.find((s) => s.value === selected[0])?.label ||
					__('All Status', 'doublescale')
				: sprintf(
						/* translators: %d is the number of selected statuses. */
						__('%d statuses', 'doublescale'),
						selected.length
				  );

	const toggle = (value: string) => {
		if (selected.includes(value)) {
			onChange(selected.filter((v) => v !== value));
		} else {
			onChange([...selected, value]);
		}
	};

	if (tab === 'payments') {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground"
				>
					{label}
					<ChevronDown width={16} height={16} className="text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="max-h-56 w-60 overflow-y-auto"
			>
				<StatusOptionCheckbox
					checked={selected.length === 0}
					label={__('All Status', 'doublescale')}
					onToggle={() => onChange([])}
				/>
				{visibleGroups.map((group) => (
					<div key={group.key}>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
							{group.label}
						</DropdownMenuLabel>
						{group.statuses.map((status) => (
							<StatusOptionCheckbox
								key={`${group.key}-${status.value}`}
								checked={selected.includes(status.value)}
								label={status.label}
								onToggle={() => toggle(status.value)}
							/>
						))}
					</div>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const cardPdfButton = (pdfUrl: string | null) =>
	pdfUrl ? (
		<a
			href={pdfUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-accent"
		>
			<DownloadIcon
				width={ACTION_ICON_SIZE}
				height={ACTION_ICON_SIZE}
				color="#29292E"
			/>
			{__('PDF', 'doublescale')}
		</a>
	) : (
		<span className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-muted-foreground opacity-50">
			<DownloadIcon
				width={ACTION_ICON_SIZE}
				height={ACTION_ICON_SIZE}
				color="#29292E"
			/>
			{__('PDF', 'doublescale')}
		</span>
	);

const cardViewButton = (to: string, label: string) => (
	<Link
		to={to}
		className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
	>
		<ViewIcon width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} />
		{label}
	</Link>
);

const documentSortDate = (doc: PortalDocument): string =>
	doc.date || doc.due_date || doc.open_till || '';

const paymentSortDate = (payment: PortalPayment): string =>
	payment.payment_date || '';

const DocumentCard = ({ doc }: { doc: PortalDocument }) => {
	const theme = CARD_THEME[doc.type];
	const title =
		doc.type === 'invoice' || doc.type === 'credit_note'
			? doc.number
			: doc.subject || doc.number;
	const pdfUrl = getDocumentPdfUrl(doc);
	const viewTo = `${documentRouteSegment(doc.type)}/${doc.hash}`;

	let meta: ReactNode = null;

	if (doc.type === 'invoice') {
		meta = (
			<MetaGrid>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Invoice Date', 'doublescale')}
					value={doc.date ? formatDate(doc.date) : '—'}
				/>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Due Date', 'doublescale')}
					value={doc.due_date ? formatDate(doc.due_date) : '—'}
				/>
				<MetaCell
					icon={metaPaidIcon()}
					label={__('Paid', 'doublescale')}
					value={formatCardMoney(doc.amount_paid ?? 0, doc.currency)}
				/>
				<MetaCell
					icon={metaDollarIcon()}
					label={__('Balance', 'doublescale')}
					value={formatCardMoney(doc.balance ?? 0, doc.currency)}
				/>
			</MetaGrid>
		);
	}

	if (doc.type === 'proposal') {
		meta = (
			<MetaGrid>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Date', 'doublescale')}
					value={doc.date ? formatDate(doc.date) : '—'}
				/>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Open Till', 'doublescale')}
					value={doc.open_till ? formatDate(doc.open_till) : '—'}
				/>
			</MetaGrid>
		);
	}

	if (doc.type === 'contract') {
		meta = (
			<MetaGrid>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Start Date', 'doublescale')}
					value={doc.date ? formatDate(doc.date) : '—'}
				/>
				<MetaCell
					icon={metaDateIcon()}
					label={__('End Date', 'doublescale')}
					value={doc.open_till ? formatDate(doc.open_till) : '—'}
					danger
				/>
			</MetaGrid>
		);
	}

	if (doc.type === 'credit_note') {
		meta = (
			<MetaGrid>
				<MetaCell
					icon={metaDateIcon()}
					label={__('Due Date', 'doublescale')}
					value={doc.date ? formatDate(doc.date) : '—'}
				/>
				<MetaCell
					icon={metaPaidIcon()}
					label={__('Applied', 'doublescale')}
					value={formatCardMoney(doc.amount_paid ?? 0, doc.currency)}
				/>
				<MetaCell
					icon={metaDollarIcon()}
					label={__('Remaining', 'doublescale')}
					value={formatCardMoney(doc.balance ?? 0, doc.currency)}
				/>
			</MetaGrid>
		);
	}

	return (
		<DocumentCardShell
			theme={theme}
			headerIcon={documentCardIcon(doc.type)}
			title={title}
			subtitle={typeLabel(doc.type)}
			status={documentStatusPill(doc)}
			amount={formatCardMoney(doc.total, doc.currency)}
			meta={meta}
			footer={
				<>
					{cardPdfButton(pdfUrl)}
					{cardViewButton(viewTo, __('View', 'doublescale'))}
				</>
			}
		/>
	);
};

const PaymentCard = ({ payment }: { payment: PortalPayment }) => {
	const theme = CARD_THEME.payment;

	return (
		<DocumentCardShell
			theme={theme}
			headerIcon={
				<AppliedCreditIcon
					width={HEADER_ICON_SIZE}
					height={HEADER_ICON_SIZE}
					color="currentColor"
				/>
			}
			title={sprintf(
				/* translators: %s is the invoice number. */
				__('Invoice %s', 'doublescale'),
				payment.invoice_number
			)}
			subtitle={__('Payment', 'doublescale')}
			amount={formatCardMoney(payment.amount, payment.currency)}
			meta={
				<MetaGrid>
					<MetaCell
						icon={metaDateIcon()}
						label={__('Date', 'doublescale')}
						value={
							payment.payment_date
								? formatDate(payment.payment_date)
								: '—'
						}
					/>
					<MetaCell
						icon={metaPaymentMethodIcon()}
						label={__('Payment Method', 'doublescale')}
						value={
							payment.payment_mode
								? payment.payment_mode.replace(/_/g, ' ')
								: '—'
						}
					/>
				</MetaGrid>
			}
			footer={
				<>
					{payment.invoice_hash
						? cardPdfButton(getPublicInvoicePdfUrl(payment.invoice_hash))
						: cardPdfButton(null)}
					{cardViewButton(
						`invoice/${payment.invoice_hash}`,
						__('View Invoice', 'doublescale')
					)}
				</>
			}
		/>
	);
};

const DocumentsHome = () => {
	const [tab, setTab] = useState<DocTab>('all');
	const [query, setQuery] = useState('');
	const [statuses, setStatuses] = useState<string[]>([]);
	const [page, setPage] = useState(1);

	const creditNotesEnabled = isCreditNotesPortalModuleEnabled();
	const creditNotesPro = isCreditNotesPortalProActive();
	const contractsEnabled = isContractsPortalModuleEnabled();
	const contractsPro = isContractsPortalProActive();
	const invoicesPaymentsPro = isInvoicesPaymentsPortalProActive();

	const statusGroups = useMemo(() => {
		return STATUS_GROUPS.filter((group) => {
			if (group.key === 'invoice') {
				return invoicesPaymentsPro;
			}
			if (group.key === 'contract') {
				return contractsEnabled;
			}
			if (group.key === 'credit_note') {
				return creditNotesEnabled;
			}
			return true;
		});
	}, [invoicesPaymentsPro, contractsEnabled, creditNotesEnabled]);

	const tabs = useMemo(() => {
		const items: Array<{ key: DocTab; label: string; icon: ReactNode }> = [
			{
				key: 'all',
				label: __('All', 'doublescale'),
				icon: <CategoryIcon width={24} height={24} />,
			},
			{
				key: 'invoice',
				label: __('Invoices', 'doublescale'),
				icon: <InvoicesIcon width={24} height={24} />,
			},
			{
				key: 'proposal',
				label: __('Proposals', 'doublescale'),
				icon: <ProposalsIcon width={24} height={24} />,
			},
		];
		if (contractsEnabled) {
			items.push({
				key: 'contract',
				label: __('Contracts', 'doublescale'),
				icon: <ContractDraftIcon width={24} height={24} />,
			});
		}
		if (creditNotesEnabled) {
			items.push({
				key: 'credit_note',
				label: __('Credit Notes', 'doublescale'),
				icon: (
					<TotalCreditedIcon width={24} height={24} color="currentColor" />
				),
			});
		}
		items.push({
			key: 'payments',
			label: __('Payments', 'doublescale'),
			icon: (
				<AppliedCreditIcon width={24} height={24} color="currentColor" />
			),
		});
		return items;
	}, [contractsEnabled, creditNotesEnabled]);

	useEffect(() => {
		setStatuses([]);
		setPage(1);
		setQuery('');
	}, [tab]);

	useEffect(() => {
		setPage(1);
	}, [query, statuses]);

	const docFilter: DocumentFilter =
		tab === 'payments' ? 'all' : (tab as DocumentFilter);

	const shouldFetchPayments =
		(tab === 'all' || tab === 'payments') && invoicesPaymentsPro;

	const {
		data: docsData,
		loading: docsLoading,
		error: docsError,
	} = useAsync(() => fetchDocuments(docFilter), [docFilter, tab !== 'payments']);

	const {
		data: paymentsData,
		loading: paymentsLoading,
		error: paymentsError,
	} = useAsync(
		() => (shouldFetchPayments ? fetchPayments() : Promise.resolve(null)),
		[shouldFetchPayments]
	);

	const docs = useMemo(() => {
		return (docsData?.data || []).filter((doc) => {
			if (!invoicesPaymentsPro && doc.type === 'invoice') {
				return false;
			}
			if (!contractsPro && doc.type === 'contract') {
				return false;
			}
			if (!creditNotesPro && doc.type === 'credit_note') {
				return false;
			}
			return true;
		});
	}, [docsData, invoicesPaymentsPro, contractsPro, creditNotesPro]);

	const normalizedQuery = query.trim().toLowerCase();

	const filteredDocs = useMemo(() => {
		return docs.filter((doc) => {
			if (statuses.length > 0 && !statuses.includes(doc.status)) {
				return false;
			}
			if (!normalizedQuery) {
				return true;
			}
			const haystack = `${doc.number} ${doc.subject || ''}`.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [docs, statuses, normalizedQuery]);

	const payments = paymentsData?.data || [];
	const filteredPayments = useMemo(() => {
		if (!normalizedQuery) {
			return payments;
		}
		return payments.filter((p) =>
			`${p.invoice_number} ${p.payment_mode}`.toLowerCase().includes(normalizedQuery)
		);
	}, [payments, normalizedQuery]);

	const listItems = useMemo((): DocumentListItem[] => {
		if (tab === 'payments') {
			return filteredPayments.map((payment) => ({
				kind: 'payment',
				payment,
				sortDate: paymentSortDate(payment),
			}));
		}

		const docItems: DocumentListItem[] = filteredDocs.map((doc) => ({
			kind: 'document',
			doc,
			sortDate: documentSortDate(doc),
		}));

		if (tab !== 'all' || !invoicesPaymentsPro) {
			return docItems;
		}

		const paymentItems: DocumentListItem[] = filteredPayments.map(
			(payment) => ({
				kind: 'payment',
				payment,
				sortDate: paymentSortDate(payment),
			})
		);

		return [...docItems, ...paymentItems].sort((a, b) =>
			b.sortDate.localeCompare(a.sortDate)
		);
	}, [tab, filteredDocs, filteredPayments, invoicesPaymentsPro]);

	const isPaymentsOnly = tab === 'payments';
	const loading =
		tab === 'all' && invoicesPaymentsPro
			? docsLoading || paymentsLoading
			: isPaymentsOnly
				? paymentsLoading
				: docsLoading;
	const error =
		tab === 'all' && invoicesPaymentsPro
			? docsError || paymentsError
			: isPaymentsOnly
				? paymentsError
				: docsError;
	const totalPages = Math.max(1, Math.ceil(listItems.length / PAGE_SIZE));
	const pageItems = listItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const showProGate =
		(tab === 'invoice' && !invoicesPaymentsPro) ||
		(tab === 'payments' && !invoicesPaymentsPro) ||
		(tab === 'contract' && contractsEnabled && !contractsPro) ||
		(tab === 'credit_note' && creditNotesEnabled && !creditNotesPro);

	const empty = emptyCopy(tab);

	return (
		<section>
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<h2 className="text-2xl font-semibold text-foreground">
					{__('Documents', 'doublescale')}
				</h2>
				<div className="flex flex-wrap gap-2">
					{tabs.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
								tab === t.key
									? 'bg-[#EEEEFF] text-primary'
									: 'border border-border bg-white text-foreground hover:bg-accent'
							}`}
						>
							{t.icon}
							{t.label}
						</button>
					))}
				</div>
			</div>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative min-w-0 flex-1">
					<Search
						width={16}
						height={16}
						className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={__('Search by title…', 'doublescale')}
						className="pl-9"
					/>
				</div>
				<StatusFilterSelect
					tab={tab}
					selected={statuses}
					onChange={setStatuses}
					groups={statusGroups}
				/>
			</div>

			{showProGate ? (
				tab === 'contract' ? (
					<ContractsPortalProGate />
				) : tab === 'credit_note' ? (
					<CreditNotesPortalProGate />
				) : (
					<InvoicePaymentsPortalProGate />
				)
			) : (
				<>
					{loading && <Spinner />}
					{!loading && error && <ErrorState message={error} />}
					{!loading && !error && listItems.length === 0 && (
						<EmptyState
							icon={empty.icon}
							title={empty.title}
							description={empty.description}
						/>
					)}
					{!loading && !error && listItems.length > 0 && (
						<>
							{isPaymentsOnly &&
								paymentsData &&
								paymentsData.total_paid > 0 && (
									<p className="mb-4 text-sm text-muted-foreground">
										{__('Total paid', 'doublescale')}:{' '}
										<span className="font-semibold text-foreground">
											{formatCardMoney(
												paymentsData.total_paid,
												paymentsData.currency
											)}
										</span>
									</p>
								)}
							<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
								{pageItems.map((item) =>
									item.kind === 'payment' ? (
										<div
											key={`payment-${item.payment.id}`}
											className="h-full"
										>
											<PaymentCard payment={item.payment} />
										</div>
									) : (
										<div
											key={`${item.doc.type}-${item.doc.id}`}
											className="h-full"
										>
											<DocumentCard doc={item.doc} />
										</div>
									)
								)}
							</div>
							<DocumentsPagination
								page={page}
								totalPages={totalPages}
								onPageChange={setPage}
							/>
						</>
					)}
				</>
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
			className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:bg-accent"
			aria-label={__('Back to documents', 'doublescale')}
		>
			<ChevronLeftIcon className="h-5 w-5" />
		</button>
	);
};

const DocumentDetailFrame = ({
	children,
	pdfUrl,
}: {
	children: ReactNode;
	pdfUrl?: string | null;
}) => (
	<section className="min-w-0">
		<div className="mb-5 flex items-center justify-between gap-3">
			<BackLink />
			{pdfUrl ? (
				<a
					href={pdfUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-accent"
				>
					<DownloadIcon width={18} height={18} color="#3a3a99" />
					{__('Download PDF', 'doublescale')}
				</a>
			) : (
				<span />
			)}
		</div>
		<div className="min-w-0">{children}</div>
	</section>
);

const InvoiceDetail = () => {
	const { hash } = useParams();
	const invoicesPaymentsPro = isInvoicesPaymentsPortalProActive();

	if (!invoicesPaymentsPro) {
		return (
			<section>
				<div className="mb-5">
					<BackLink />
				</div>
				<InvoicePaymentsPortalProGate />
			</section>
		);
	}

	return (
		<DocumentDetailFrame
			pdfUrl={hash ? getPublicInvoicePdfUrl(hash) : null}
		>
			{hash ? (
				<PublicInvoiceApp hash={hash} embedded />
			) : (
				<div className="p-5">
					<ErrorState message={__('Invoice not found.', 'doublescale')} />
				</div>
			)}
		</DocumentDetailFrame>
	);
};

const ProposalDetail = () => {
	const { hash } = useParams();
	return (
		<DocumentDetailFrame
			pdfUrl={hash ? getPublicProposalPdfUrl(hash) : null}
		>
			{hash ? (
				<PublicProposalApp hash={hash} embedded />
			) : (
				<div className="p-5">
					<ErrorState
						message={__('Proposal not found.', 'doublescale')}
					/>
				</div>
			)}
		</DocumentDetailFrame>
	);
};

const ContractDetail = () => {
	const { hash } = useParams();
	const contractsPro = isContractsPortalProActive();

	if (!contractsPro) {
		return (
			<section>
				<div className="mb-5">
					<BackLink />
				</div>
				<ContractsPortalProGate />
			</section>
		);
	}

	return (
		<DocumentDetailFrame
			pdfUrl={hash ? getPublicContractPdfUrl(hash) : null}
		>
			{hash ? (
				<PublicContractApp hash={hash} embedded />
			) : (
				<div className="p-5">
					<ErrorState
						message={__('Contract not found.', 'doublescale')}
					/>
				</div>
			)}
		</DocumentDetailFrame>
	);
};

const CreditNoteDetail = () => {
	const { hash } = useParams();
	const pdfUrl = hash
		? `${(
				getPortalConfig()?.credit_note_public_rest_url ||
				'/wp-json/doublescale/v1/sales/public/credit-notes'
			).replace(/\/$/, '')}/${hash}/pdf`
		: null;

	return (
		<DocumentDetailFrame pdfUrl={pdfUrl}>
			{hash ? (
				<PortalCreditNoteDetail hash={hash} embedded />
			) : (
				<div className="p-5">
					<ErrorState
						message={__('Credit note not found.', 'doublescale')}
					/>
				</div>
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
