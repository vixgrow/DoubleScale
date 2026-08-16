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
	WhatsAppIcon,
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
	/** Opens the WhatsApp share dialog for this document. */
	onSendWhatsApp?: () => void;
	onDownloadPdf?: () => void;
	onDelete?: () => void;
}

/** Run after the menu finishes closing so a newly opened dialog is not dismissed by leftover pointer/focus events. */
const afterMenuCloses = (handler?: () => void) => {
	if (!handler) {
		return undefined;
	}
	return () => {
		window.setTimeout(handler, 0);
	};
};

export const DocumentRowActions: React.FC<DocumentRowActionsProps> = ({
	busy = false,
	onView,
	onEdit,
	onDuplicate,
	onConvert,
	onViewInvoice,
	onMarkAccepted,
	onSend,
	onSendWhatsApp,
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
			<DropdownMenuContent
				align="end"
				onCloseAutoFocus={(event) => event.preventDefault()}
			>
				<DropdownMenuItem onClick={afterMenuCloses(onView)} disabled={busy}>
					<ViewIcon />
					{__('View', 'doublescale')}
				</DropdownMenuItem>

				{onEdit ? (
					<DropdownMenuItem onClick={afterMenuCloses(onEdit)} disabled={busy}>
						<EditHeaderIcon color="currentColor" width={20} height={20} />
						{__('Edit', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDuplicate ? (
					<DropdownMenuItem onClick={afterMenuCloses(onDuplicate)} disabled={busy}>
						<CopyIcon width={20} height={20} />
						{__('Duplicate', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onViewInvoice ? (
					<DropdownMenuItem onClick={afterMenuCloses(onViewInvoice)} disabled={busy}>
						<PurchaseHistoryIcon />
						{__('View Invoice', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onConvert ? (
					<DropdownMenuItem onClick={afterMenuCloses(onConvert)} disabled={busy}>
						<PurchaseHistoryIcon />
						{__('Convert to Invoice', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onMarkAccepted ? (
					<DropdownMenuItem onClick={afterMenuCloses(onMarkAccepted)} disabled={busy}>
						<CheckMark />
						{__('Mark as Accepted', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onSend ? (
					<DropdownMenuItem onClick={afterMenuCloses(onSend)} disabled={busy}>
						<SendTestEmailIcon width={20} height={20} />
						{__('Send to Customer', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onSendWhatsApp ? (
					<DropdownMenuItem onClick={afterMenuCloses(onSendWhatsApp)} disabled={busy}>
						<WhatsAppIcon width={20} height={20} />
						{__('Send via WhatsApp', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDownloadPdf ? (
					<DropdownMenuItem onClick={afterMenuCloses(onDownloadPdf)} disabled={busy}>
						<DownloadIcon />
						{__('Download PDF', 'doublescale')}
					</DropdownMenuItem>
				) : null}

				{onDelete ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={afterMenuCloses(onDelete)}
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
