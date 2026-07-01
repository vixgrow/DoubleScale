/**
 * Convert proposal to invoice confirmation dialog.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { ConvertToInvoiceIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface ConvertToInvoiceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	description: string;
	busy?: boolean;
	onConfirm: () => void | Promise<void>;
}

export const ConvertToInvoiceDialog: React.FC<ConvertToInvoiceDialogProps> = ({
	open,
	onOpenChange,
	description,
	busy = false,
	onConfirm,
}) => (
	<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="max-w-md gap-0 p-6 bg-white sm:rounded-xl z-[150300]">
			<DialogHeader className="space-y-0">
				<div className="flex flex-col items-center gap-4 pb-2 text-center">
					<ConvertToInvoiceIcon width={100} height={100} />
					<DialogTitle className="text-xl font-semibold text-[#CB5301]">
						{__('Convert to Invoice', 'doublescale')}
					</DialogTitle>
					<DialogDescription className="text-center text-sm text-accent-foreground">
						{description}
					</DialogDescription>
				</div>
			</DialogHeader>
			<DialogFooter className="mt-8 flex flex-row justify-end gap-2 sm:justify-end">
				<Button
					type="button"
					variant="outline"
					disabled={busy}
					onClick={() => onOpenChange(false)}
					className="border-primary text-primary bg-white"
				>
					{__('Cancel', 'doublescale')}
				</Button>
				<Button
					type="button"
					disabled={busy}
					onClick={() => void onConfirm()}
				>
					{busy ? __('Please wait…', 'doublescale') : __('Convert', 'doublescale')}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
