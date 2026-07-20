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
}

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
	open,
	onOpenChange,
	invoiceId = null,
	initialContactId,
	initialLineItems,
	initialCurrency,
	onSaved,
}) => {
	const isNew = invoiceId === null;
	const pageTitle = isNew
		? __('Create New Invoice', 'doublescale')
		: __('Edit Invoice', 'doublescale');

	return (
		<Dialog open={open} modal={false} onOpenChange={onOpenChange}>
			<DialogContent
				className="doublescale-contact-page doublescale-invoice-form-dialog z-[150200] flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-[#eef1f7] to-slate-100/95 p-0 shadow-none [&>button]:text-muted-foreground [&>button]:hover:bg-muted/60"
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
			</DialogContent>
		</Dialog>
	);
};

export default InvoiceFormDialog;
