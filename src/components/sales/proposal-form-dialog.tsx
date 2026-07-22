/**
 * Reusable create/edit proposal dialog — open from any page.
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
import ProposalForm from './proposal-form';
import type { LineItem } from '@/types/sales';

export interface ProposalFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	proposalId?: number | null;
	initialContactId?: number;
	initialSubject?: string;
	initialLineItems?: LineItem[];
	initialCurrency?: string;
	onSaved?: (proposalId: number) => void;
}

export const ProposalFormDialog: React.FC<ProposalFormDialogProps> = ({
	open,
	onOpenChange,
	proposalId = null,
	initialContactId,
	initialSubject,
	initialLineItems,
	initialCurrency,
	onSaved,
}) => {
	const isNew = proposalId === null;
	const pageTitle = isNew
		? __('Create New Proposal', 'doublescale')
		: __('Edit Proposal', 'doublescale');

	return (
		<Dialog open={open} modal={false} onOpenChange={onOpenChange}>
			<DialogContent
				className="doublescale-contact-page doublescale-proposal-form-dialog z-[150200] flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-[#eef1f7] to-slate-100/95 p-0 shadow-none [&>button]:text-muted-foreground [&>button]:hover:bg-muted/60"
				style={{
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,
					paddingBottom: 0,
				}}
			>
				<DialogHeader className="shrink-0 bg-white pb-0">
					<DialogTitle className="sr-only">{pageTitle}</DialogTitle>
					<div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-6 py-3">
						<nav
							className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground"
							aria-label={__('Breadcrumb', 'doublescale')}
						>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="mx-2.5 rounded-md font-medium leading-7 text-foreground"
							>
								{__('Sales (Proposals)', 'doublescale')}
							</button>
							<ChevronRight
								className="h-3.5 w-3.5 shrink-0 text-foreground"
								aria-hidden
							/>
							<span className="text-sm font-semibold leading-7 tracking-tight text-muted-foreground">
								{pageTitle}
							</span>
						</nav>
					</div>
				</DialogHeader>

				<ProposalForm
					key={`${proposalId ?? 'new'}-${initialContactId ?? ''}-${initialCurrency ?? ''}-${initialSubject ?? ''}-${initialLineItems?.[0]?.description ?? ''}-${initialLineItems?.[0]?.rate ?? ''}-${open}`}
					proposalId={proposalId}
					initialContactId={initialContactId}
					initialSubject={initialSubject}
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

export default ProposalFormDialog;
