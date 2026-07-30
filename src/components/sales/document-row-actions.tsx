/**
 * Row actions dropdown shared by the proposal and invoice list tables.
 *
 * Every action is optional: an item renders only when its callback is passed,
 * so each list opts into the subset it supports without the two menus drifting
 * apart.
 */

import { __ } from '@wordpress/i18n';

import {
	CopyIcon,
	DeleteIcon,
	DownloadIcon,
	EditHeaderIcon,
	PurchaseHistoryIcon,
	SendTestEmailIcon,
	ThreeDotsIcon,
	ViewIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@doublescale/components/ui/dropdown-menu';

export interface DocumentRowActionsProps {
	/** Disables every item while a request for this row is in flight. */
	busy?: boolean;
	onView: () => void;
	onEdit?: () => void;
	onDuplicate?: () => void;
	/** Proposals only, and only while no invoice exists yet. */
	onConvert?: () => void;
	/** Proposals only: jumps to the invoice already created from this document. */
	onViewInvoice?: () => void;
	/** Proposals only: manual accept for deals closed outside the public link. */
	onMarkAccepted?: () => void;
	onSend?: () => void;
	onDownloadPdf?: () => void;
	onDelete?: () => void;
}

export const DocumentRowActions: React.FC<DocumentRowActionsProps> = ({
	busy = false,
	onView,
	onEdit,
	onDuplicate,
	onConvert,
	onViewInvoice,
	onMarkAccepted,
	onSend,
	onDownloadPdf,
	onDelete,
}) => (
	<div
		className="flex items-center justify-center"
		onClick={(e) => e.stopPropagation()}
	>
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-0"
					aria-label={__('Actions', 'doublescale')}
				>
					<ThreeDotsIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onView} disabled={busy}>
					<ViewIcon />
					{__('View', 'doublescale')}
				</DropdownMenuItem>

				{onEdit ? (
					<DropdownMenuItem onClick={onEdit} disabled={busy}>
						<EditHeaderIcon color="currentColor" width={20} height={20} />
						{__('Edit', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDuplicate ? (
					<DropdownMenuItem onClick={onDuplicate} disabled={busy}>
						<CopyIcon width={20} height={20} />
						{__('Duplicate', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onViewInvoice ? (
					<DropdownMenuItem onClick={onViewInvoice} disabled={busy}>
						<PurchaseHistoryIcon />
						{__('View Invoice', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onConvert ? (
					<DropdownMenuItem onClick={onConvert} disabled={busy}>
						<PurchaseHistoryIcon />
						{__('Convert to Invoice', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onMarkAccepted ? (
					<DropdownMenuItem onClick={onMarkAccepted} disabled={busy}>
						<CheckMark />
						{__('Mark as Accepted', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onSend ? (
					<DropdownMenuItem onClick={onSend} disabled={busy}>
						<SendTestEmailIcon width={20} height={20} />
						{__('Send to Customer', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDownloadPdf ? (
					<DropdownMenuItem onClick={onDownloadPdf} disabled={busy}>
						<DownloadIcon />
						{__('Download PDF', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDelete ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={onDelete}
							disabled={busy}
							className="text-destructive hover:text-destructive focus:text-destructive"
						>
							<DeleteIcon />
							{__('Delete', 'doublescale')}
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
);

/** Inline check glyph — no shared icon exists for a positive status change. */
const CheckMark: React.FC = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M20 6L9 17L4 12"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
