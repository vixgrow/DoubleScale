/**
 * Reusable create/edit invoice dialog — open from any page.
 * Layout matches deal-detail-modal and PanelLayout fullscreen shells.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ChevronRight } from 'lucide-react';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import InvoiceForm from './invoice-form';
import type { LineItem } from '@/types/sales';

export interface InvoiceFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoiceId?: number | null;
	initialContactId?: number;
	initialLineItems?: LineItem[];
	initialCurrency?: string;
	onSaved?: (invoiceId: number) => void;
	/** Raise above fullscreen shells (e.g. project detail). */
	elevated?: boolean;
}

const elevatedShellClassName =
	'!fixed !inset-0 !left-0 !top-0 !right-0 !bottom-0 !h-[100dvh] !max-h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !z-[1800005] pointer-events-auto';

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
	open,
	onOpenChange,
	invoiceId = null,
	initialContactId,
	initialLineItems,
	initialCurrency,
	onSaved,
	elevated = false,
}) => {
	const isNew = invoiceId === null;
	const pageTitle = isNew
		? __('Create New Invoice', 'doublescale')
		: __('Edit Invoice', 'doublescale');

	return (
		<Dialog open={open} modal={elevated} onOpenChange={onOpenChange}>
			<DialogContent
				overlayClassName={elevated ? '!z-[1800004]' : undefined}
				className={`doublescale-contact-page doublescale-invoice-form-dialog !flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-[#eef1f7] to-slate-100/95 p-0 shadow-none [&>button]:text-muted-foreground [&>button]:hover:bg-muted/60 ${
					elevated ? elevatedShellClassName : 'z-[150200]'
				}`}
				style={{
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,
					paddingBottom: 0,
				}}
			>
				<DialogHeader className="shrink-0  bg-white pb-0">
					<DialogTitle className="sr-only">{pageTitle}</DialogTitle>
					<div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-6 py-3 ">
						<nav
							className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground"
							aria-label={__('Breadcrumb', 'doublescale')}
						>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="mx-2.5 rounded-md  text-foreground font-medium leading-7"
							>
								{__('Sales (Invoices)', 'doublescale')}
							</button>
							<ChevronRight
								className="h-3.5 w-3.5 shrink-0 text-foreground"
								aria-hidden
							/>
							<span className="text-sm font-semibold tracking-tight text-muted-foreground leading-7">
								{pageTitle}
							</span>
						</nav>
					</div>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<InvoiceForm
						key={`${invoiceId ?? 'new'}-${initialContactId ?? ''}-${initialCurrency ?? ''}-${initialLineItems?.[0]?.description ?? ''}-${initialLineItems?.[0]?.rate ?? ''}-${open}`}
						invoiceId={invoiceId}
						initialContactId={initialContactId}
						initialLineItems={initialLineItems}
						initialCurrency={initialCurrency}
						mode="dialog"
						onClose={() => onOpenChange(false)}
						onSaved={(id) => {
							onSaved?.(id);
							onOpenChange(false);
						}}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default InvoiceFormDialog;
